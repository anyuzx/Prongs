const builtins = require('rollup-plugin-node-builtins');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');

export default {
  input: 'src/admin/preview.js',
  output: {
    file: 'dist/admin/preview.js',
    format: 'esm',
  },
  plugins: [
    builtins(),
    nodeResolve(),
    commonjs(),
    json(),
  ]
};
