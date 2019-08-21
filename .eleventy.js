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

// customize markdown-it
let options = {
  html: true,
  typographer: true,
  linkify: true
};

customMarkdownIt = markdownIt(options)
  .use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"})
  .use(markdownItFootnote)
  .use(markdownImplicitFigure)
  .use(markdownItContainer, 'note');

// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender = customMarkdownIt.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

customMarkdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target');

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};

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

  // add filter to render markdown
  config.addFilter("renderUsingMarkdown", rawString => customMarkdownIt.render(rawString));

  // add plugins
  config.addPlugin(syntaxHighlight);
  config.addPlugin(pluginRss);
  //config.addPlugin(lazyImagesPlugin);

  // add passthrough copy
  config.addPassthroughCopy("src/_includes/css");
  config.addPassthroughCopy("src/assets");
  config.addPassthroughCopy("src/site.webmanifest");
  config.addPassthroughCopy("src/_redirects");
  config.addPassthroughCopy("src/admin");

  config.setLibrary("md", customMarkdownIt);

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
