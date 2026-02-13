const fs = require("fs/promises");
const path = require("path");
const axios = require("axios");

const headers = {
  Accept: "application/vnd.citationstyles.csl+json",
  "User-Agent": "Prongs (personal website) (mailto:stefanshi1988@gmail.com)"
};

const doiList = require("../contents/publications/publication_doi.json");
const CACHE_PATH = path.join(__dirname, "../contents/publications/publication_data.json");

function shouldFetchRemoteData() {
  return process.env.FETCH_REMOTE_DATA === "1" || process.env.ELEVENTY_FETCH_REMOTE === "1";
}

function isValidPublication(item) {
  return Boolean(
    item &&
      !item.error &&
      Array.isArray(item.author) &&
      item.issued &&
      Array.isArray(item.issued["date-parts"]) &&
      item.title
  );
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeCache(publications) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, `${JSON.stringify(publications, null, 2)}\n`, "utf8");
}

async function getBib(doi, retries = 2) {
  const url = `https://doi.org/${encodeURIComponent(doi)}`;

  try {
    const response = await axios.get(url, { headers, timeout: 2500 });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      const delay = (3 - retries) * 2000;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return getBib(doi, retries - 1);
    }

    return {
      doi,
      error: true,
      errorMessage: error.message
    };
  }
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

module.exports = async function() {
  const cached = await readCache();
  if (!shouldFetchRemoteData()) {
    return cached;
  }

  const results = [];
  const chunks = chunkArray(doiList, 5);
  for (const chunk of chunks) {
    const chunkResults = await Promise.all(chunk.map((doi) => getBib(doi)));
    results.push(...chunkResults);
  }

  const publications = results.filter(isValidPublication);
  if (publications.length > 0) {
    await writeCache(publications);
    return publications;
  }

  return cached;
};
