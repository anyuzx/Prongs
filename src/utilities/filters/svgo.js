const { optimize } = require("svgo");

module.exports = (svgContent, callback) => {
  let data;
  try {
    ({ data } = optimize(svgContent, {
      // SVGO 4 preserves viewBox by default; inline icons must remain scalable.
      plugins: ["preset-default", "removeXMLNS", "removeDimensions"]
    }));
  } catch (error) {
    return callback(error);
  }
  callback(null, data);
};
