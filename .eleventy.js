// require the npm modules
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const dayjs = require("dayjs");
const SVGO = require("svgo");
const inclusiveLangPlugin = require("@11ty/eleventy-plugin-inclusive-language");
//const lazyImagesPlugin = require('eleventy-plugin-lazyimages');

// local library/modules
const mdRender = require('./src/_includes/js/mdRender.js');
const applyTypeset = require('./src/_includes/js/typeset.js')({ disable: ['smallCaps'] });
const htmlmin = require('./src/_includes/js/html-minify.js');

// initialize SVGO
var svgo = new SVGO({plugins: [{removeXMLNS: true}]});

// define environment variable
let env = process.env.ELEVENTY_ENV;

// config for eleventy starts from here
module.exports = function(config) {
  // Filter source file names using a glob
  config.addCollection('posts', function(collection) {
    return [
      ...collection.getFilteredByGlob('src/contents/posts/*.md')
    ].reverse();
  });
  config.addCollection('research', function(collection) {
    return [
      ...collection.getFilteredByGlob('src/contents/research/*.md')
    ];
  });
  config.addCollection('postsLatest', function(collection) {
    return [
      ...collection.getFilteredByGlob('src/contents/posts/*.md')
    ]
    .reverse()
    .slice(0, 3);
  });
  config.addCollection("tagList", require("./src/_includes/js/getTagList.js"));
  config.addCollection("categories", require("./src/_includes/js/getCategories.js"));
  config.addCollection("photos", require("./src/_includes/js/getPhotos.js"));

  // add filter to render markdown
  config.addNunjucksFilter("renderUsingMarkdown", rawString => mdRender.render(rawString));

  // add filter to minimize svg using svgo
  config.addNunjucksAsyncFilter("svgo", async(svgContent, callback) => {
    var svgmin = await svgo.optimize(svgContent).then(({data}) => data);
    callback(null, svgmin);
  })

  // add plugins
  //config.addPlugin(syntaxHighlight);
  config.addPlugin(pluginRss);
  config.addPlugin(inclusiveLangPlugin);
  //config.addPlugin(lazyImagesPlugin);

  // add passthrough copy
  config.addPassthroughCopy("src/_includes/css");
  config.addPassthroughCopy("src/assets");
  config.addPassthroughCopy("src/site.webmanifest");
  config.addPassthroughCopy("src/_redirects");
  config.addPassthroughCopy("src/admin/config.yml");
  config.addPassthroughCopy("src/_includes/js/pyodide.js");
  config.addPassthroughCopy("src/_includes/js/lazysizes.min.js");
  //config.addPassthroughCopy("src/admin/preview.js");

  config.setLibrary("md", mdRender);

  // Shortcodes
  // shortcode for injecting typography css
  config.addShortcode("injectTypography", require('./src/_includes/js/typography.js'));
  config.addShortcode("dayjs", function(date, format) {
    return dayjs(date).format(format);
  });

  // add transform
  // used to post-process
  // apply html minification (only in production)
  if (env == "production") {
    config.addTransform("htmlmin", htmlmin);
  };

  // use typeset
  config.addTransform("typeset", applyTypeset);

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
