const Typography = require('typography')
const TypographyBootstrap = require('typography-theme-bootstrap').default
//TypographyBootstrap.baseLineHeight = 1.63
//TypographyBootstrap.overrideThemeStyles = (options, styles) => ({})

const typography = new Typography({ ...TypographyBootstrap,
                                    scaleRatio: 2.0,
                                    baseLineHeight: 1.63,
                                    headerWeight: 600,
                                    includeNormalize: false,
                                    bodyFontFamily: ['IBM Plex Sans','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue','sans-serif'],
                                    headerFontFamily: ['IBM Plex Sans','-apple-system','BlinkMacSystemFont','Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue','sans-serif']
                                 })

module.exports = function () {
  return typography.toString()
}
