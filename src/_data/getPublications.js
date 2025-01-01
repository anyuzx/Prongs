const axios = require('axios');

// Provide a polite and identifying User-Agent
const headers = {
  'Accept': 'application/vnd.citationstyles.csl+json',
  'User-Agent': 'Prongs (personal website) (mailto:stefanshi1988@gmail.com)',
};

// Load your list of DOIs (adjust the path as needed)
const doiList = require('../contents/publications/publication_doi.json');

/**
 * Fetch bibliography data for a single DOI, retrying if rate-limited.
 * @param {string} doi - The DOI to fetch
 * @param {number} retries - How many retries left for 429 errors
 * @returns {object} Parsed CSL JSON data or an { error: true } object on failure
 */
async function getBib(doi, retries = 5) {
  const url = `https://doi.org/${encodeURIComponent(doi)}`;

  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    // If we got a 429 (Too Many Requests) and still have retries
    if (error.response && error.response.status === 429 && retries > 0) {
      const delay = (6 - retries) * 5000; // 5s, 10s, 15s, ...
      console.warn(`Rate limited fetching ${doi}. Retrying in ${delay / 1000} seconds...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return getBib(doi, retries - 1); // Retry
    }

    // For any other error (404, 500, etc.), log and return an error object
    console.error(`Failed to fetch ${doi}:`, error.message);
    return {
      doi,
      error: true,
      errorMessage: error.message,
    };
  }
}

/**
 * Breaks an array into smaller chunks of size `size`.
 * @param {Array} array - The array to chunk
 * @param {number} size - The chunk size
 * @returns {Array[]} An array of chunk arrays
 */
function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Main function: fetch all publication DOIs in smaller batches to avoid rate-limiting.
 * Returns an array of publication data (some entries may have { error: true } if fetch failed).
 */
module.exports = async function() {
  try {
    // Adjust batchSize as desired. Smaller = fewer parallel requests.
    const batchSize = 3;
    const chunks = chunkArray(doiList, batchSize);

    const allResults = [];

    // Process each chunk sequentially
    for (const [index, chunk] of chunks.entries()) {
      console.log(`\nFetching batch ${index + 1} of ${chunks.length}...`);

      // We'll fetch each DOI in the chunk sequentially to be extra polite
      // (You could do Promise.all(chunk.map(...)) if you want small concurrency.)
      for (const doi of chunk) {
        const result = await getBib(doi);
        // If it’s an error object, we keep it in the array but mark it as error
        allResults.push(result);

        // Optional: Wait 1 second between each request
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      // Optional: Wait 2 seconds between each batch
      if (index < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // This is the array Eleventy sees as data (e.g. publications)
    return allResults;

  } catch (error) {
    // If you want the build to fail upon any unhandled error, leave this throw in place
    // If you prefer to skip the entire dataset on error, you could return an empty array or partial data
    console.error('Error fetching publications:', error);
    throw error;
  }
};
