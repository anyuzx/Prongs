// config the global data here
// The data defined here is accessible by templates
// You can access the variable defined here using site.[variable_name]
// Example:
//  site.TITLE, site.DESCRIPTION, etc

module.exports = {
  "TITLE": "Guang Shi", // site title, this is used across the site. For instance the name appeared in the browser tab will be [page_name] | [site_title]
  "DESCRIPTION": "Guang Shi's personal site. Learn about my research projects, read my blog posts and see my photos.", // site description, used in meta head for SEO purpose
  "URL": "https://www.guangshi.io", // absolute url for the site
  "BUILD_TIME" : new Date(), // build time for the site
  "SOURCE_CODE": "https://github.com/anyuzx/Prongs", // the github repo of the source code
  "ENV": process.env.ELEVENTY_ENV, // environment variable can be accessed in templates https://www.11ty.io/docs/data-js/#example%3A-exposing-environment-variables
  "FEED": {
    "PATH": "feed.xml", // name of the RSS feed file. The file should be in the root of the site
    "TITLE": "Blog posts feed, by Guang Shi", // title for the RSS feed
  },
  "GOOGLE_ANALYTICS": 'UA-139423558-3',
  "AUTHOR": {
    "NAME": "Guang Shi", // author name
    "GITHUB": "anyuzx", // author's github username
    "EMAIL": "guang.shi.gs@gmail.com", // author's email address
    "INSTAGRAM": "guang_shi_stefan", // author's instagram
    // "TWITTER": "", // author's twitter handler
    // "ADDRESS": "" // author's address
  },
  "CLOUDINARY": "guangshi"
}
