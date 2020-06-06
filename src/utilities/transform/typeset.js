const typeset = require('typeset')

module.exports = (options) => {
  return function applyTypeset (content, outputPath) {
    if (outputPath && outputPath.endsWith('.html')) {
      const result = typeset(content, options)
      return result
    }
    return content
  }
}
