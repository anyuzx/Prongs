const axios = require('axios')

var headers = {
  'Accept': 'application/vnd.citationstyles.csl+json'
}

async function getBib (doi) {
  const response = await axios({url: 'https://doi.org/' + doi, headers: headers})
  return response.data
}

const doiList = require('../contents/DOI.json')

module.exports = function() {
  return Promise.all(doiList.map(getBib))
}
