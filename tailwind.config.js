module.exports = {
  theme: {
    textIndent: { // defaults to {}
      '1': '0.25rem',
      '2': '0.5rem',
    },
    textDecorationStyle: { // defaults to these values
      'solid': 'solid',
      'double': 'double',
      'dotted': 'dotted',
      'dashed': 'dashed',
      'wavy': 'wavy',
    },
    textDecorationColor: { // defaults to theme => theme('colors')
      'red': '#f00',
      'green': '#0f0',
      'blue': '#00f',
    },
    fontVariantCaps: { // defaults to these values
      'normal': 'normal',
      'small': 'small-caps',
      'all-small': 'all-small-caps',
      'petite': 'petite-caps',
      'unicase': 'unicase',
      'titling': 'titling-caps',
    },
    fontVariantNumeric: { // defaults to these values
      'normal': 'normal',
      'ordinal': 'ordinal',
      'slashed-zero': 'slashed-zero',
      'lining': 'lining-nums',
      'oldstyle': 'oldstyle-nums',
      'proportional': 'proportional-nums',
      'tabular': 'tabular-nums',
      'diagonal-fractions': 'diagonal-fractions',
      'stacked-fractions': 'stacked-fractions',
    },
    fontVariantLigatures: { // defaults to these values
      'normal': 'normal',
      'none': 'none',
      'common': 'common-ligatures',
      'no-common': 'no-common-ligatures',
      'discretionary': 'discretionary-ligatures',
      'no-discretionary': 'no-discretionary-ligatures',
      'historical': 'historical-ligatures',
      'no-historical': 'no-historical-ligatures',
      'contextual': 'contextual',
      'no-contextual': 'no-contextual',
    },
    textRendering: { // defaults to these values
      'rendering-auto': 'auto',
      'optimize-legibility': 'optimizeLegibility',
      'optimize-speed': 'optimizeSpeed',
      'geometric-precision': 'geometricPrecision'
    },
    extend: {
      margin: {
        '7': '1.75rem'
      },
      borderWidth: {
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem'
      },
      colors: {
        'primary': '#5C77A5',
        'lightShade': '#F5F4F5',
        'lightAccent': '#8CABC3',
        'darkAccent': '#425066',
        'darkShade': '#293248',
        'darkblue': '#17184b',
        'darkgray': '#4e524c',
        'lightgray': '#f0f0f4',
        'lightyellow': '#fffbf0',
        'lightblue': '#edf2f7',
      },
      fontFamily: {
      'primary': ['Inter','system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      'secondary': ['Overpass','Inter','system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      'sans': ['Inter','system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      'serif': ['"Iowan Old Style"', '"Apple Garamond"', 'Baskerville', '"Times New Roman"', '"Droid Serif"', 'Times', '"Source Serif Pro"', 'serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'],
      'mono': ['SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace']
      },
      screens: {
        "xxl": "1920px"
      }
    }
  },
  variants: {
    textDecoration: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
    borderWidth: ['responsive'],
    backgroundColor: ['responsive', 'hover', 'focus', 'active', 'group-hover', 'dark', 'dark-hover', 'dark-group-hover', 'dark-even', 'dark-odd'],
    borderColor: ['responsive', 'hover', 'focus', 'active', 'group-hover','dark', 'dark-focus', 'dark-focus-within'],
    textColor: ['responsive', 'hover', 'focus', 'active', 'group-hover','dark', 'dark-hover', 'dark-active', 'dark-placeholder'],
    textIndent: ['responsive'],
    textShadow: ['responsive'],
    textDecorationStyle: ['responsive'],
    textDecorationColor: ['responsive'],
    ellipsis: ['responsive'],
    hyphens: ['responsive'],
    kerning: ['responsive'],
    textUnset: ['responsive'],
    fontVariantCaps: ['responsive'],
    fontVariantNumeric: ['responsive'],
    fontVariantLigatures: ['responsive'],
    textRendering: ['responsive'],
    margin: ['responsive', 'last'],
    boxShadow: ['responsive', 'active', 'hover', 'focus', 'group-hover']
  },
  plugins: [
    require('tailwindcss-dark-mode')(),
    require('tailwindcss-typography')({
      ellipsis: true,
      hyphens: true,
      kerning: true,
      textUnset: true,
      componentPrefix: 'c-'
    })
  ]
}
