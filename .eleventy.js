// require the modules
const readingTime = require('reading-time');
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const markdownIt = require("markdown-it");
const markdownItKatex = require('@iktakahiro/markdown-it-katex');
const markdownItFootnote = require('markdown-it-footnote');
const markdownImplicitFigure = require('markdown-it-implicit-figures');
const markdownItContainer = require('markdown-it-container');
const dayjs = require("dayjs");
//const lazyImagesPlugin = require('eleventy-plugin-lazyimages');
const htmlmin = require("html-minifier");

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

  // add filter to count words for post
  config.addFilter("readingTime", function(s) {
    return readingTime(s);
  });

  // add filter to format date
  config.addFilter("formatDate", function(s) {
    return dayjs(s).format('MM/DD/YYYY');
  });
  config.addFilter("accurateTime", function(s) {
    return dayjs(s).format();
  });

  // add plugins
  config.addPlugin(syntaxHighlight);
  config.addPlugin(pluginRss);
  //config.addPlugin(lazyImagesPlugin);

  // add passthrough copy
  config.addPassthroughCopy("src/_includes/css");
  config.addPassthroughCopy("src/assets");
  config.addPassthroughCopy("src/site.webmanifest");
  config.addPassthroughCopy("src/_redirects");

  // customize markdown-it
  let options = {
    html: true,
    typographer: true,
    linkify: true
  };

  config.setLibrary("md", markdownIt(options)
    .use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"})
    .use(markdownItFootnote)
    .use(markdownImplicitFigure)
    .use(markdownItContainer, 'note'));

  // Shortcodes
  // shortcode for injecting typography css
  config.addShortcode("injectTypography", require('./src/_includes/js/typography.js'));

  // add transform
  // used to post-process
  config.addTransform("htmlmin", function(content, outputPath) {
    if(outputPath && outputPath.endsWith(".html") ) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true
      });
      return minified;
    }
    return content;
  });

  return {
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
