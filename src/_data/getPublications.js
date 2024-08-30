const axios = require('axios');

// Set up headers with User-Agent and mailto
const headers = {
  'Accept': 'application/vnd.citationstyles.csl+json',
  'User-Agent': 'Prongs (personal website) (mailto:stefanshi1988@gmail.com)'
};

// Function to fetch bibliography data for a single DOI
async function getBib(doi, retries = 5) {
  const url = `https://doi.org/${encodeURIComponent(doi)}`;
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      const delay = (6 - retries) * 5000; // Start with a 5-second delay and increase with retries
      console.log(`Rate limited. Retrying ${doi} in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return getBib(doi, retries - 1);
    } else {
      console.error(`Failed to fetch ${doi}:`, error.message);
      throw error;
    }
  }
}

// Import DOI list from an external JSON file
const doiList = require('../contents/publications/publication_doi.json');

// Function to fetch data for all DOIs
module.exports = async function() {
  try {
    const results = await Promise.all(doiList.map(doi => getBib(doi)));
    return results;
  } catch (error) {
    console.error('Error fetching publications:', error.message);
    throw error; // Re-throw the error to ensure the calling program is aware of it
  }
};
