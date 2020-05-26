const markdownIt = require('markdown-it')
const markdownItKatex = require('@iktakahiro/markdown-it-katex')
const markdownItFootnote = require('markdown-it-footnote')
const markdownImplicitFigure = require('markdown-it-implicit-figures')
const markdownItContainer = require('markdown-it-container')
const markdownItAnchor = require('markdown-it-anchor')
const markdownItEmoji = require('markdown-it-emoji')
const markdownItSub = require('markdown-it-sub')
const markdownItSup = require('markdown-it-sup')
const markdownItIns = require('markdown-it-ins')
const markdownItMark = require('markdown-it-mark')
const markdownItAbbr = require('markdown-it-abbr')
const markdownItAttr = require('markdown-it-attrs')
const markdownItKbd = require('markdown-it-kbd')
const markdownItTOC = require('markdown-it-toc-done-right')

const hljs = require('highlight.js')

// customize markdown-it
const options = {
  html: true,
  typographer: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' + hljs.highlight(lang, str, true).value + '</code></pre>'
      } catch (_) {}
    }
    return '<pre class="hljs"><code>' + markdownIt.utils.escapeHtml(str) + '</code></pre>'
  }
}

var customMarkdownIt = new markdownIt(options)

customMarkdownIt
  .use(markdownItKatex, { throwOnError: false, errorColor: ' #cc0000' })
  .use(markdownItFootnote)
  .use(markdownImplicitFigure, {
    figcaption: true
  })
  .use(markdownItAnchor)
  .use(markdownItEmoji)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItIns)
  .use(markdownItMark)
  .use(markdownItAbbr)
  .use(markdownItAttr)
  .use(markdownItKbd)
  .use(markdownItTOC)
  .use(markdownItContainer, 'note')
  .use(markdownItContainer, 'collapse', {
    validate: function (params) {
      return params.trim().match(/^collapse\s+(.*)$/)
    },
    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^collapse\s+(.*)$/)
      if (tokens[idx].nesting === 1) {
        // opening tag
        return '<details><summary>' + customMarkdownIt.renderInline(m[1]) + '</summary>\n'
      } else {
        // closing tag
        return '</details>\n'
      }
    }
  })
  .use(require('markdown-it-container'), 'linkButton', {

    validate: function (params) {
      return params.trim().match(/^linkButton\s+(.*)$/)
    },

    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^linkButton\s+(.*)$/)

      if (tokens[idx].nesting === 1) {
        if (m[1] === undefined) {
          return "<button class='linkButton'>"
        } else {
          return `<button class="linkButton" onClick="location.href='${customMarkdownIt.utils.escapeHtml(m[1])}'">`
        }
      } else {
        return '</button>\n'
      }
    }
  })

module.exports = customMarkdownIt
