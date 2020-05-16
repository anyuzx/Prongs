module.exports = {
  theme: {
    fontFamily: {
      'sans': ['system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'],
      'serif': ['Georgia, Cambria, "Times New Roman", Times, serif'],
      'mono': ['"IBM Plex Mono", "Fira Code", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'],
      'system-sans': ['system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"']
    },
    extend: {
      borderWidth: {
        '16': '4rem',
        '20': '5rem',
        '24': '6rem',
        '32': '8rem'
      }
    }
  },
  variants: {
    textDecoration: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
    borderWidth: ['responsive'],
    backgroundColor: ['responsive', 'hover', 'focus', 'active', 'group-hover', 'dark', 'dark-hover', 'dark-group-hover', 'dark-even', 'dark-odd'],
    borderColor: ['responsive', 'hover', 'focus', 'active', 'group-hover','dark', 'dark-focus', 'dark-focus-within'],
    textColor: ['responsive', 'hover', 'focus', 'active', 'group-hover','dark', 'dark-hover', 'dark-active', 'dark-placeholder']
  },
  plugins: [
    require('tailwindcss-dark-mode')()
  ]
}
