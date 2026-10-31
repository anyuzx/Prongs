const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const {
  normalizeTitle, parseScholarProfile, loadScholarMetrics, PROFILE_URL, CACHE_TTL_MS
} = require("../src/utilities/lib/scholarMetrics");

const OLD_DATE = "2026-10-01T00:00:00.000Z";
const NOW = "2026-10-31T00:00:00.000Z";
const ARTICLE = "/citations?view_op=view_citation&user=JMf5dv8AAAAJ&citation_for_view=JMf5dv8AAAAJ:article";

function row(title, count, options = {}) {
  const citation = options.omitCount ? "" : `<a class="gsc_a_ac"${options.countHref === null ? "" :
    ` href="${options.countHref === undefined ? (count === "" ? "" : "/scholar?cites=123456&hl=en") : options.countHref}"`}>${count}</a>`;
  return `<tr class="gsc_a_tr"><td><a class="gsc_a_at" href="${options.article || ARTICLE}">${title}</a></td>
    <td class="gsc_a_c">${citation}</td></tr>`;
}

function profile(rows, profileUrl = PROFILE_URL) {
  return `<html><head><link rel="canonical" href="${profileUrl}"></head><body>
    <div id="gsc_prf_in">Guang Shi</div><table><tbody id="gsc_a_b">${rows}</tbody></table></body></html>`;
}

function snapshot(title = "A known paper", citations = 10) {
  return parseScholarProfile(profile(row(title, String(citations))), { now: OLD_DATE });
}

async function harness(t, cached = snapshot()) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "prongs-scholar-test-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const cachePath = path.join(directory, "scholar.json");
  await fs.writeFile(cachePath, typeof cached === "string" ? cached : JSON.stringify(cached));
  const warnings = [];
  return {
    cachePath,
    now: () => Date.parse(NOW),
    logger: { warn: message => warnings.push(message) },
    warnings,
    read: async () => JSON.parse(await fs.readFile(cachePath, "utf8"))
  };
}

test("Scholar title keys allow punctuation and case differences without fuzzy matching", () => {
  assert.equal(normalizeTitle("From Hi-C:  Three-Dimensional Chromosomes"),
    normalizeTitle("from hi c three–dimensional chromosomes"));
  assert.notEqual(normalizeTitle("Chromosome dynamics"), normalizeTitle("Chromosome structure"));
  assert.equal(normalizeTitle(null), "");
});

test("Scholar parser preserves real counts and explicit zeroes, excluding unavailable or malformed counts", () => {
  const data = parseScholarProfile(profile([
    row("Counted &amp; verified", "1,234"),
    row("Uncited", "", { countHref: null }),
    row("Missing count", "", { omitCount: true }),
    row("Unavailable", "—"),
    row("Malformed", "1,23"),
    row("Missing number", "", { countHref: "/scholar?cites=123" }),
    row("Unsafe target", "99", { countHref: "https://example.com/scholar?cites=123" }),
    row("Wrong author", "88", { article: ARTICLE.replaceAll("JMf5dv8AAAAJ", "OTHER") })
  ].join("")), { now: NOW });
  assert.equal(Object.keys(data.papers).length, 2);
  assert.equal(data.papers[normalizeTitle("Counted & verified")].citations, 1234);
  assert.equal(data.papers.uncited.citations, 0);
  assert.equal(new URL(data.papers.uncited.url).searchParams.get("citation_for_view"), "JMf5dv8AAAAJ:article");
  assert.equal(data.updatedAt, NOW);
});

test("Scholar parser rejects ambiguous duplicate titles and challenge or wrong-profile responses", () => {
  const data = parseScholarProfile(profile(row("Repeated-title", "4") + row("Repeated title", "8") +
    row("Unique title", "9")), { now: NOW });
  assert.equal(data.papers.repeatedtitle, undefined);
  assert.equal(data.papers.uniquetitle.citations, 9);
  assert.throws(() => parseScholarProfile("<html>Please complete the CAPTCHA</html>"), /challenge/);
  assert.throws(() => parseScholarProfile(profile(row("Paper", "7"),
    PROFILE_URL.replace("JMf5dv8AAAAJ", "OTHER"))), /unrecognized profile/);
  assert.throws(() => parseScholarProfile(profile(row("Unavailable", "—"))), /no unambiguous/);
});

test("offline Scholar builds and fresh caches make no network request", async t => {
  const h = await harness(t);
  const request = async () => { throw new Error("Unexpected request"); };
  const cached = await h.read();
  assert.deepEqual(await loadScholarMetrics({ ...h, request, fetchRemote: false }), cached);
  assert.deepEqual(await loadScholarMetrics({
    ...h, request, fetchRemote: true, now: () => Date.parse(OLD_DATE) + CACHE_TTL_MS - 1
  }), cached);
  assert.equal(h.warnings.length, 0);
});

test("Scholar refresh makes one bounded profile request and preserves dates of missing records", async t => {
  const cached = snapshot();
  Object.assign(cached.papers, snapshot("No longer in listing", 12).papers);
  Object.assign(cached.papers, snapshot("Temporarily unavailable", 7).papers);
  const h = await harness(t, cached);
  const calls = [];
  const result = await loadScholarMetrics({
    ...h, fetchRemote: true,
    request: async (url, options) => {
      calls.push({ url, options });
      return { status: 200, data: profile(row("A known paper", "15") + row("New uncited paper", "") +
        row("Temporarily unavailable", "—")) };
    }
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `${PROFILE_URL}&pagesize=100`);
  assert.equal(calls[0].options.timeout, 7000);
  assert.equal(calls[0].options.maxRedirects, 0);
  assert.equal(result.papers.aknownpaper.citations, 15);
  assert.equal(result.papers.aknownpaper.updatedAt, NOW);
  assert.equal(result.papers.nolongerinlisting.citations, 12);
  assert.equal(result.papers.nolongerinlisting.updatedAt, OLD_DATE);
  assert.equal(result.papers.temporarilyunavailable.citations, 7);
  assert.equal(result.papers.temporarilyunavailable.updatedAt, OLD_DATE);
  assert.equal(result.papers.newuncitedpaper.citations, 0);
  assert.deepEqual(await h.read(), result);
});

test("a failed Scholar request never overwrites good cached data", async t => {
  const cases = [
    ["rate limit", async () => { throw { response: { status: 429 } }; }],
    ["timeout", async () => { throw { code: "ECONNABORTED" }; }],
    ["challenge", async () => ({ status: 200, data: "<html>CAPTCHA</html>" })],
    ["invalid markup", async () => ({ status: 200, data: profile(row("Unknown", "—")) })],
    ["unexpected HTTP status", async () => ({ status: 429, data: "Too many requests" })]
  ];
  for (const [name, fail] of cases) {
    await t.test(name, async inner => {
      const h = await harness(inner);
      const cached = await h.read();
      let calls = 0;
      const result = await loadScholarMetrics({
        ...h, fetchRemote: true, request: async () => { calls++; return fail(); }
      });
      assert.deepEqual(result, cached);
      assert.deepEqual(await h.read(), cached);
      assert.equal(calls, 1);
      assert.equal(h.warnings.length, 1);
    });
  }
});

test("corrupt Scholar cache remains unavailable until a verified response replaces it", async t => {
  const h = await harness(t, "not JSON");
  const empty = await loadScholarMetrics({ ...h, fetchRemote: false });
  assert.deepEqual(empty.papers, {});
  assert.equal(empty.updatedAt, null);
  const fresh = await loadScholarMetrics({
    ...h, fetchRemote: true,
    request: async () => ({ status: 200, data: profile(row("Verified", "22")) })
  });
  assert.equal(fresh.papers.verified.citations, 22);
  assert.deepEqual(await h.read(), fresh);
});

test("Scholar refresh decodes the profile's declared ISO-8859-1 charset", async t => {
  const h = await harness(t);
  const result = await loadScholarMetrics({
    ...h, fetchRemote: true,
    request: async () => ({
      status: 200, headers: { "content-type": "text/html; charset=ISO-8859-1" },
      data: Buffer.from(profile(row("Café research", "2")), "latin1")
    })
  });
  assert.equal(result.papers[normalizeTitle("Café research")].title, "Café research");
});
