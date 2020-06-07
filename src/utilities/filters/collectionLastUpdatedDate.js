/// modified based on rssLastUpdatedDate filter in https://github.com/11ty/eleventy-plugin-rss
const { DateTime } = require("luxon");

const dateTOISO = function(dateObj) {
  return DateTime.fromJSDate(dateObj).toISO({ includeOffset: true, suppressMilliseconds: true });
}

module.exports = function (collection) {
    if (!collection || !collection.length ){
        throw new Error( "Collection is empty in collectionLastUpdatedDate filter.")
    }

    // newest date in the collection
    const lastUpdatedDate = new Date(Math.max(...collection.map(x => {return x.date})))
    return dateTOISO(lastUpdatedDate)
}
