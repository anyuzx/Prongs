// require the npm modules
const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");
const pluginRss = require("@11ty/eleventy-plugin-rss");
const dayjs = require("dayjs");
const SVGO = require("svgo");
//const lazyImagesPlugin = require('eleventy-plugin-lazyimages');

// local library/modules
const mdRender = require('./src/_includes/js/mdRender.js');
const applyTypeset = require('./src/_includes/js/typeset.js')({ disable: ['smallCaps'] });
const htmlmin = require('./src/_includes/js/html-minify.js');
const purgeCSS = require('./src/_includes/js/purgecss.js');

const Terser = require('terser'); // minify js code

// support YAML as data file format
const yaml = require('js-yaml');

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
  //config.addCollection("tagList", require("./src/_includes/js/getTagList.js"));
  config.addCollection("postByTag", require("./src/_includes/js/getPostByTag.js"));
  config.addCollection("categories", require("./src/_includes/js/getCategories.js"));
  config.addCollection("photos", require("./src/_includes/js/getPhotos.js"));

  // add filter to render markdown
  config.addNunjucksFilter("renderUsingMarkdown", rawString => mdRender.render(rawString));

  // add filter to sort by nested key, expanding the dictsort functionality
  config.addNunjucksFilter("dictNestSortBy", function (value, key) {
    var sorted = {};
    Object.keys(value).sort(function(a, b){
      return value[b][key] - value[a][key];
    })
    .forEach(function (key) {
      sorted[key] = value[key];
    });
    return sorted;
  });

  // add filter to groupby attribute of datafile
  config.addNunjucksFilter("groupByEx", function (arr, key) {
      const result = {};
      arr.forEach(item => {
          const keys = key.split('.');
          const value = keys.reduce((object, key) => object[key], item);

          (result[value] || (result[value] = [])).push(item);
      });

      // now we need sort by year
      // use Map not Object since the integer key in Object can not be sorted
      let orderedResult = new Map([]);
      Object.keys(result).sort().reverse().forEach(function(key) {
        orderedResult.set(key, result[key])
      })
      return orderedResult;
  });

  // add filter to minimize svg using svgo
  config.addNunjucksAsyncFilter("svgo", async(svgContent, callback) => {
    var svgmin = await svgo.optimize(svgContent).then(({data}) => data);
    callback(null, svgmin);
  })

  // add filter to minimize javascript code
  config.addNunjucksFilter("jsmin", function (code) {
    let minified = Terser.minify(code);
    if (minified.error) {
      console.log("Terser error: ", minified.error);
      return code;
    }

    return minified.code;
  });

  // add plugins
  config.addPlugin(pluginRss);

  // add passthrough copy
  config.addPassthroughCopy("src/assets");
  config.addPassthroughCopy("src/site.webmanifest");
  config.addPassthroughCopy("src/_redirects");
  config.addPassthroughCopy("src/admin/config.yml");
  config.addPassthroughCopy("src/_includes/js/pyodide.js");
  config.addPassthroughCopy("src/_includes/js/lazysizes.min.js");

  config.setLibrary("md", mdRender);

  // Shortcodes
  // shortcode for injecting typography css
  // config.addShortcode("injectTypography", require('./src/_includes/js/typography.js'));
  config.addShortcode("dayjs", function(date, format) {
    return dayjs(date).format(format);
  });

  // use typeset
  config.addTransform("typeset", applyTypeset);

  // add transform
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
    markdownTemplateEngine: "njk",
    dir: {
      input: "src",
      output: "dist"
    }
  }
}
