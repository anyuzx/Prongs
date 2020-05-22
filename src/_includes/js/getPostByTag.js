module.exports = function (collection) {
  // initialize a object to store all post object by tags
  // example
  // {
  //  tag1: {'count':2, 'posts':[post1, post2]},
  //  tag2: {'count':3, 'posts':[post1, post2, post3]},
  // }
  let postByTagCollection = {}

  // use eleventy provided collection API to get all the tags and loop through it
  collection.getFilteredByGlob('src/contents/posts/*.md').forEach(function (item) {
    if ('tags' in item.data) {
      let tags = item.data.tags
      if (typeof tags === 'string') {
        tags = [tags]
      }

      tags = tags.filter(function (item) {
        switch (item) {
          // this list should match the `filter` list in tags.njk
          // case "all":
          // case "posts":
          case 'pinned':
            return false
        }

        return true
      })

      // loop through each tag
      for (const tag of tags) {
        if (tag in postByTagCollection) {
          postByTagCollection[tag]['count'] += 1
          postByTagCollection[tag]['posts'].push(item)
        } else {
          postByTagCollection[tag] = {}
          postByTagCollection[tag]['count'] = 1
          postByTagCollection[tag]['posts'] = [item]
        }
      }
    }
  })

  return postByTagCollection
}
