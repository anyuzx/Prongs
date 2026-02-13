const htmlmin = require("html-minifier");

module.exports = function(content, outputPath) {
  if(outputPath && outputPath.endsWith(".html") ) {
    try {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
        minifyJS: true,
        minifyCSS: true,
        sortAttributes: true,
        sortClassName: true,
      });
      return minified;
    } catch (error) {
      console.warn(`[html-minify] Skipping minification for ${outputPath}.`);
      return content;
    }
  }
  return content;
};
