// configuration for postcss
// for more details, refer to https://tailwindcss.com/docs/controlling-file-size/#app
const purgecss = require('@fullhuman/postcss-purgecss')({
  // Specify the paths to all of the template files in your project
  content: [
    './dist/**/*.html'
  ],

  whitelist: [
    'mode-dark'
  ],

  // Include any special characters you're using in this regular expression
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
})

module.exports = {
  plugins: [
    require('tailwindcss'),
    require('autoprefixer'),
    require('cssnano')({
      preset: 'default'
    }),
    ...process.env.ELEVENTY_ENV === 'production'
      ? [purgecss]
      : []
  ]
}
