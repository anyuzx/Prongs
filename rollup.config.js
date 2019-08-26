const builtins = require('rollup-plugin-node-builtins');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');

export default {
  input: 'src/admin/preview.js',
  output: {
    file: 'dist/admin/preview.js',
    format: 'esm',
  },
  plugins: [
    nodeResolve({browser:true}),
    commonjs({ignore: ["conditional-runtime-dependency"]}),
    builtins(),
    json(),
    babel({
      "plugins": [
        ["prismjs", {
          "languages": ["javascript", "css", "markup", "python", "clike"]
        }]
      ]
    })
  ]
};