module.exports = function(collection) {
  // let tagSet = new Set();
  let tagDic = {};
  let tagArray = [];
  collection.getAllSorted().forEach(function(item) {
    if( "tags" in item.data ) {
      let tags = item.data.tags;
      if( typeof tags === "string" ) {
        tags = [tags];
      }

      tags = tags.filter(function(item) {
        switch(item) {
          // this list should match the `filter` list in tags.njk
          case "all":
          case "posts":
          return false;
        }

        return true;
      });

      for (const tag of tags) {
        // tagSet.add(tag);
        if (tag in tagDic) {
          tagDic[tag] += 1
        } else {
          tagDic[tag] = 1
        }
      }
    }
  });

  // returning an array in addCollection works in Eleventy 0.5.3
  // return [...tagSet].sort();
  for (var key in tagDic) {
    tagArray.push([key, tagDic[key]])
  };

  tagArray.sort(function(a, b) {
    return (a[0].toUpperCase() < b[0].toUpperCase()) ? -1 : 1;
  });

  return tagArray;
};
