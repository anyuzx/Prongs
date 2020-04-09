const Typography = require('typography')
const TypographyBootstrap = require('typography-theme-bootstrap').default
//TypographyBootstrap.baseLineHeight = 1.63
//TypographyBootstrap.overrideThemeStyles = (options, styles) => ({})

const typography = new Typography({ ...TypographyBootstrap,
                                    baseFontSize: '15px',
                                    scaleRatio: 1.25,
                                    baseLineHeight: 1.5,
                                    headerWeight: 700,
                                    includeNormalize: false,
                                    bodyFontFamily: ['Inter', '-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue','sans-serif'],
                                    headerFontFamily: ['Inter', '-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue','sans-serif']
                                 })

module.exports = function () {
  return typography.toString()
}
