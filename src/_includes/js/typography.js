const Typography = require('typography')
const TypographyBootstrap = require('typography-theme-bootstrap').default
//TypographyBootstrap.baseLineHeight = 1.63
//TypographyBootstrap.overrideThemeStyles = (options, styles) => ({})

const typography = new Typography({ ...TypographyBootstrap,
                                    scaleRatio: 2.0,
                                    baseLineHeight: 1.63,
                                    headerWeight: 600,
                                    includeNormalize: false,
                                 })

module.exports = function () {
  return typography.toString()
}
