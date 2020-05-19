import builtins from 'rollup-plugin-node-builtins'
import json from '@rollup/plugin-json'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default {
  input: 'src/admin/preview.js',
  output: {
    file: 'dist/admin/preview.js',
    format: 'esm'
  },
  plugins: [
    resolve({ browser: true, preferBuiltins: false}),
    commonjs(),
    builtins(),
    json()
  ]
}
