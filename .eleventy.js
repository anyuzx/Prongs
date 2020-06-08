// require the npm modules
const pluginRss = require("@11ty/eleventy-plugin-rss");
const pluginPWA = require("eleventy-plugin-pwa");

// local library/modules
const mdRender = require('./src/utilities/lib/mdRender.js');
const typeset = require('./src/utilities/transform/typeset.js')({ disable: ['smallCaps'] });
const htmlmin = require('./src/utilities/transform/html-minify.js');
const purgeCSS = require('./src/utilities/transform/purgecss.js');

// support YAML as data file format
const yaml = require('js-yaml');

// define environment variable
let env = process.env.ELEVENTY_ENV;

// define constant for source and publish directory
const SOURCE_DIR = './src';
const PUBLISH_DIR = './dist';

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
  config.addCollection("postByTag", require("./src/utilities/collections/getPostByTag.js"));
  config.addCollection("categories", require("./src/utilities/collections/getCategories.js"));
  config.addCollection("photos", require("./src/utilities/collections/getPhotos.js"));
  // add filter to render markdown
  config.addNunjucksFilter("renderUsingMarkdown", rawString => mdRender.render(rawString));
  config.addNunjucksFilter("inlineRenderUsingMarkdown", rawString => mdRender.renderInline(rawString));
  // add filter to sort array by nested key, expanding the sort functionality
  config.addNunjucksFilter("sort_array", require("./src/utilities/filters/sort_array.js"));
  // add filter to sort dictionary by nested key, expanding the dictsort functionality
  config.addNunjucksFilter("dictNestSortBy", require('./src/utilities/filters/dictNestSortBy.js'));
  // add filter to group by attribute
  config.addNunjucksFilter("groupByEx", require('./src/utilities/filters/groupByEx.js'));
  // add filter to minimize svg using svgo
  config.addNunjucksAsyncFilter("svgo", require('./src/utilities/filters/svgo.js'));
  // add filter to minimize javascript code
  config.addNunjucksFilter("jsmin", require('./src/utilities/filters/jsmin.js'));
  // add filter to get the last updated date from a collection
  config.addNunjucksFilter("collectionLastUpdatedDate", require('./src/utilities/filters/collectionLastUpdatedDate.js'));

  // add plugins
  config.addPlugin(pluginRss);
  config.addPlugin(pluginPWA);

  // add passthrough copy
  config.addPassthroughCopy({"src/assets/favicon/*": "/"});
  config.addPassthroughCopy("src/assets/images");
  config.addPassthroughCopy("src/admin/config.yml");
  config.addPassthroughCopy("src/_includes/js/pyodide.js");

  config.setLibrary("md", mdRender);

  // Shortcodes
  // shortcode for injecting typography css
  config.addShortcode("dayjs", require('./src/utilities/shortcodes/dayjs.js'));
  // shortcode for code highlighting
  config.addPairedShortcode("codeHighlight", require('./src/utilities/shortcodes/codeHighlight.js'));
  // shortcode for insert cloudinary responsive image markup
  config.addShortcode("responImg", require('./src/utilities/shortcodes/responImg.js'));

  // add transform
  // use typeset
  config.addTransform("typeset", typeset);
  // used to post-process
  // apply html minification (only in production)
  if (env == "production") {
    // purge css and inject to <head> in html
    config.addTransform('purgeCSS', purgeCSS);
    // minimizer html, including css and js
    config.addTransform("htmlmin", htmlmin);
  };

  // support YAML format
  config.addDataExtension("yaml", contents => yaml.safeLoad(contents));

  return {
    dataTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    dir: {
      input: SOURCE_DIR,
      output: PUBLISH_DIR
    }
  }
}
