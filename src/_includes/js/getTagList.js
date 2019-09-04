module.exports = function(collection) {
  // initialize a object to store all the tags
  let tagDic = {};
  // initialize an array for the final output
  let tagArray = [];

  // use eleventy provided collection API to get all the tags and loop through it
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
          case "pinned":
          return false;
        }

        return true;
      });

      // loop through each tag
      for (const tag of tags) {
        if (tag in tagDic) {
          tagDic[tag] += 1
        } else {
          tagDic[tag] = 1
        }
      }
    }
  });

  // populate the array
  // first column is the tag name
  // second column is the number of posts with that tag
  for (var key in tagDic) {
    tagArray.push([key, tagDic[key]])
  };

  // sort the array using the tag name (alphabetically)
  tagArray.sort(function(a, b) {
    return (a[0].toUpperCase() < b[0].toUpperCase()) ? -1 : 1;
  });

  // returning an array in addCollection works in Eleventy 0.5.3
  return tagArray;
};
