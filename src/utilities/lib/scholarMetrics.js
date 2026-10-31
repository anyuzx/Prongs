const fs = require("node:fs/promises");
const path = require("node:path");
const axios = require("axios");
const { parseDocument, DomUtils } = require("htmlparser2");

const PROFILE_ID = "JMf5dv8AAAAJ";
const PROFILE_URL = `https://scholar.google.com/citations?user=${PROFILE_ID}&hl=en`;
const CACHE_PATH = path.join(__dirname, "../../contents/publications/scholar_metrics.json");
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// Match complete titles, allowing only case, whitespace and punctuation differences.
function normalizeTitle(title) {
  return typeof title === "string"
    ? title.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "")
    : "";
}

function canonicalScholarUrl(value) {
  try {
    const url = new URL(value, PROFILE_URL);
    if (url.origin !== "https://scholar.google.com" || url.username || url.password) return null;
    if (url.pathname === "/scholar" && /^\d+(,\d+)*$/.test(url.searchParams.get("cites") || "")) {
      return `https://scholar.google.com/scholar?${new URLSearchParams({
        cites: url.searchParams.get("cites"), hl: "en"
      })}`;
    }
    const article = url.searchParams.get("citation_for_view") || "";
    if (url.pathname === "/citations" && url.searchParams.get("view_op") === "view_citation" &&
        url.searchParams.get("user") === PROFILE_ID &&
        new RegExp(`^${PROFILE_ID}:[A-Za-z0-9_-]+$`).test(article)) {
      return `https://scholar.google.com/citations?${new URLSearchParams({
        view_op: "view_citation", hl: "en", user: PROFILE_ID, citation_for_view: article
      })}`;
    }
  } catch {}
  return null;
}

function hasClass(node, name) {
  return (node.attribs?.class || "").split(/\s+/).includes(name);
}

function elements(root, predicate) {
  return DomUtils.findAll(node => Boolean(node.attribs) && predicate(node), root.children || []);
}

function timestamp(now) {
  const value = typeof now === "function" ? now() : now;
  return new Date(value === undefined ? Date.now() : value).toISOString();
}

function parseScholarProfile(html, { now } = {}) {
  if (typeof html !== "string") throw new Error("Scholar returned an invalid response");
  const document = parseDocument(html, { decodeEntities: true });
  const profile = elements(document, node => node.attribs.id === "gsc_prf_in")[0];
  const canonical = elements(document, node => node.name === "link" && node.attribs.rel === "canonical")[0];
  let isExpectedProfile = false;
  try {
    const url = new URL(canonical?.attribs.href);
    isExpectedProfile = url.origin === "https://scholar.google.com" && url.pathname === "/citations" &&
      url.searchParams.get("user") === PROFILE_ID;
  } catch {}
  const table = elements(document, node => node.attribs.id === "gsc_a_b")[0];
  if (!profile || !DomUtils.textContent(profile).trim() || !isExpectedProfile || !table) {
    throw new Error("Scholar returned a challenge or an unrecognized profile");
  }

  const updatedAt = timestamp(now);
  const papers = {};
  const seen = new Set();
  const duplicates = new Set();
  for (const row of elements(table, node => node.name === "tr" && hasClass(node, "gsc_a_tr"))) {
    const titles = elements(row, node => node.name === "a" && hasClass(node, "gsc_a_at"));
    if (titles.length !== 1) continue;
    const title = DomUtils.textContent(titles[0]).trim();
    const key = normalizeTitle(title);
    if (!key) continue;
    if (seen.has(key)) {
      duplicates.add(key);
      delete papers[key];
      continue;
    }
    seen.add(key);
    const articleUrl = canonicalScholarUrl(titles[0].attribs.href);
    const counts = elements(row, node => node.name === "a" && hasClass(node, "gsc_a_ac"));
    if (!articleUrl || counts.length !== 1) continue;
    const countText = DomUtils.textContent(counts[0]).trim();
    const countHref = (counts[0].attribs.href || "").trim();
    const citedByUrl = canonicalScholarUrl(countHref);
    let citations;
    let url;
    if (/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(countText) && citedByUrl &&
        new URL(citedByUrl).pathname === "/scholar") {
      citations = Number(countText.replace(/,/g, ""));
      url = citedByUrl;
    } else if (countText === "" && countHref === "") {
      // Scholar explicitly renders an empty citation anchor for an uncited paper.
      citations = 0;
      url = articleUrl;
    } else {
      continue;
    }
    if (!Number.isSafeInteger(citations) || citations < 0) continue;
    papers[key] = { title, citations, url, updatedAt };
  }
  for (const key of duplicates) delete papers[key];
  if (Object.keys(papers).length === 0) throw new Error("Scholar returned no unambiguous citation records");
  return { profileUrl: PROFILE_URL, updatedAt, papers };
}

function validTimestamp(value) {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

async function readCache(cachePath) {
  const empty = { profileUrl: PROFILE_URL, updatedAt: null, papers: {} };
  try {
    const cached = JSON.parse(await fs.readFile(cachePath, "utf8"));
    if (cached.profileUrl !== PROFILE_URL || !validTimestamp(cached.updatedAt) ||
        !cached.papers || typeof cached.papers !== "object" || Array.isArray(cached.papers)) return empty;
    const papers = {};
    for (const [key, item] of Object.entries(cached.papers)) {
      const url = canonicalScholarUrl(item?.url);
      if (!item || !key || key !== normalizeTitle(item.title) ||
          !Number.isSafeInteger(item.citations) || item.citations < 0 || !url ||
          !validTimestamp(item.updatedAt)) continue;
      papers[key] = { title: item.title, citations: item.citations, url, updatedAt: item.updatedAt };
    }
    return { profileUrl: PROFILE_URL, updatedAt: cached.updatedAt, papers };
  } catch {
    return empty;
  }
}

function decodeResponse(response) {
  if (response.status !== undefined && response.status !== 200) {
    throw new Error(`Scholar HTTP ${response.status}`);
  }
  if (typeof response.data === "string") return response.data;
  if (Buffer.isBuffer(response.data) || response.data instanceof Uint8Array) {
    const contentType = String(response.headers?.["content-type"] || "");
    const encoding = /charset\s*=\s*["']?(?:iso-8859-1|windows-1252)/i.test(contentType) ? "latin1" : "utf8";
    return Buffer.from(response.data).toString(encoding);
  }
  throw new Error("Scholar returned an invalid response");
}

async function loadScholarMetrics({
  fetchRemote = process.env.FETCH_REMOTE_DATA === "1" || process.env.ELEVENTY_FETCH_REMOTE === "1",
  request = axios.get,
  now = Date.now,
  cachePath = CACHE_PATH,
  logger = console
} = {}) {
  const cached = await readCache(cachePath);
  const checkedAt = timestamp(now);
  const age = Date.parse(checkedAt) - Date.parse(cached.updatedAt);
  if (!fetchRemote || (Object.keys(cached.papers).length > 0 && age >= 0 && age < CACHE_TTL_MS)) return cached;

  let refreshed;
  try {
    // One public profile listing, with no retries, search queries, or pagination.
    const response = await request(`${PROFILE_URL}&pagesize=100`, {
      timeout: 7000,
      responseType: "arraybuffer",
      maxContentLength: 2 * 1024 * 1024,
      maxRedirects: 0,
      headers: { "User-Agent": "Prongs personal website citation refresh" }
    });
    refreshed = parseScholarProfile(decodeResponse(response), { now: checkedAt });
  } catch (error) {
    const reason = error.response?.status ? `HTTP ${error.response.status}` :
      error.code === "ECONNABORTED" || error.code === "ETIMEDOUT" ? "request timed out" :
        "response unavailable or invalid";
    logger.warn(`[scholar] ${reason}; keeping ${Object.keys(cached.papers).length} cached citation records.`);
    return cached;
  }

  const merged = { ...refreshed, papers: { ...cached.papers, ...refreshed.papers } };
  try {
    await fs.mkdir(path.dirname(cachePath), { recursive: true });
    await fs.writeFile(cachePath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
  } catch {
    logger.warn("[scholar] Refreshed counts are available, but the citation cache could not be saved.");
  }
  return merged;
}

module.exports = { normalizeTitle, parseScholarProfile, loadScholarMetrics, PROFILE_URL, CACHE_TTL_MS };
