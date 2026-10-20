module.exports = {
  content: [
    "./src/**/*.{njk,md,html,js,json,yml,yaml}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      margin: {
        "7": "1.75rem"
      },
      borderWidth: {
        "16": "4rem",
        "20": "5rem",
        "24": "6rem",
        "32": "8rem"
      },
      colors: {
        darkblue: "#17184b",
        lightblue: "#F0F4FF",
        darkgray: "#3D3B4F",
        darkergray: "#e1e1e1",
        lightgray: "#f4f4f4",
        lightergray: "#fafafa",
        lightyellow: "#fffbf0",
        darkyellow: "#F2ECDE"
      },
      fontFamily: {
        primary: [
          '"Source Sans 3"',
          '"Noto Sans SC"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        secondary: [
          '"Source Serif 4"',
          '"Noto Serif SC"',
          "Georgia",
          '"Times New Roman"',
          "serif"
        ],
        sans: [
          '"Source Sans 3"',
          '"Noto Sans SC"',
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        serif: [
          '"Source Serif 4"',
          '"Noto Serif SC"',
          "Georgia",
          '"Iowan Old Style"',
          '"Apple Garamond"',
          "Baskerville",
          '"Times New Roman"',
          '"Droid Serif"',
          "Times",
          "serif",
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"'
        ],
        mono: [
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace"
        ]
      },
      screens: {
        xxl: "1920px"
      },
      maxHeight: {
        "80screen": "80vh"
      }
    }
  },
  plugins: []
};
