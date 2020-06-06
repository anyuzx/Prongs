const htmlmin = require("html-minifier");

module.exports = function(content, outputPath) {
  if(outputPath && outputPath.endsWith(".html") ) {
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
  }
  return content;
};
