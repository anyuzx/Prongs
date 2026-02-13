const polyfillNode = require("rollup-plugin-polyfill-node");
const json = require("@rollup/plugin-json");
const commonjs = require("@rollup/plugin-commonjs");
const resolve = require("@rollup/plugin-node-resolve");

module.exports = {
  input: "src/admin/preview.js",
  output: {
    file: "dist/admin/preview.js",
    format: "esm"
  },
  plugins: [
    resolve({ browser: true, preferBuiltins: false }),
    polyfillNode(),
    commonjs(),
    json()
  ]
};
