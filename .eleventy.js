// require the modules
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const dayjs = require("dayjs");
const SVGO = require("svgo");
const htmlmin = require("html-minifier");
//const lazyImagesPlugin = require('eleventy-plugin-lazyimages');

const mdRender = require('./src/_includes/js/mdRender.js');


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

  // add filter to render markdown
  config.addFilter("renderUsingMarkdown", rawString => mdRender.render(rawString));

  // add filter to minimize svg using svgo
  config.addNunjucksAsyncFilter("svgo", async(svgContent, callback) => {
    var svgmin = await svgo.optimize(svgContent).then(({data}) => data);
    callback(null, svgmin);
  })

  // add plugins
  config.addPlugin(syntaxHighlight);
  config.addPlugin(pluginRss);
  //config.addPlugin(lazyImagesPlugin);

  // add passthrough copy
  config.addPassthroughCopy("src/_includes/css");
  config.addPassthroughCopy("src/assets");
  config.addPassthroughCopy("src/site.webmanifest");
  config.addPassthroughCopy("src/_redirects");
  config.addPassthroughCopy("src/admin/config.yml");
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
  if (env == "production") {
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
  };

  return {
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
