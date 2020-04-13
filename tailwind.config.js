module.exports = {
  theme: {
    fontFamily: {
      'sans': ['"Inter var", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'],
      'serif': ['Georgia, Cambria, "Times New Roman", Times, serif'],
      'mono': ['"Fira Code", Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace']
    },
    extend: {
      borderWidth: {
        '20': '5rem',
        '32': '8rem'
      }
    }
  },
  variants: {
    textDecoration: ['responsive', 'hover', 'focus', 'active', 'group-hover'],
    borderWidth: ['responsive']
  },
  plugins: []
}
