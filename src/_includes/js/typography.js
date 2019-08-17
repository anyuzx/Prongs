const Typography = require('typography')
const TypographyBootstrap = require('typography-theme-bootstrap').default
TypographyBootstrap.baseLineHeight = 1.63

const typography = new Typography(TypographyBootstrap)

module.exports = function () {
  return typography.toString()
}
