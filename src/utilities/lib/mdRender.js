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
// the following part is from markdown-it-highlight plugin
const maybe = f => {
  try {
    return f()
  } catch (e) {
    return false
  }
}

// Allow registration of other languages.
const registerLangs = (register) => register &&
  Object.entries(register).map(([lang, pack]) => { hljs.registerLanguage(lang, pack) })

// Highlight with given language.
const highlight = (code, lang) =>
  maybe(() => hljs.highlight(lang || 'plaintext', code, true).value) || ''

// Highlight with given language or automatically.
const highlightAuto = (code, lang) =>
  lang
    ? highlight(code, lang)
    : maybe(() => hljs.highlightAuto(code).value) || ''

// Wrap a render function to add `hljs` class to code blocks.
const wrap = render =>
  function (...args) {
    return render.apply(this, args)
      .replace('<pre><code class="', '<pre class="hljs"><code class="hljs ')
      .replace('<code>', '<code class="hljs">')
  }

const highlightjs = (md, opts) => {
  opts = Object.assign({}, highlightjs.defaults, opts)
  registerLangs(opts.register)

  md.options.highlight = opts.auto ? highlightAuto : highlight
  md.renderer.rules.fence = wrap(md.renderer.rules.fence)

  if (opts.code) {
    md.renderer.rules.code_block = wrap(md.renderer.rules.code_block)
  }
}

highlightjs.defaults = {
  auto: true,
  code: true
}

// customize markdown-it
const options = {
  html: true,
  typographer: true,
  linkify: true
}

var customMarkdownIt = new markdownIt(options)

customMarkdownIt
  .use(highlightjs)
  .use(markdownItKatex, { throwOnError: false, errorColor: ' #cc0000' })
  .use(markdownItFootnote)
  .use(markdownImplicitFigure, {
    figcaption: true
  })
  .use(markdownItAnchor, { permalink: true, permalinkSymbol: "#" })
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
  .use(require('markdown-it-container'), 'anchorButton', {

    validate: function (params) {
      return params.trim().match(/^anchorButton\s+(.*)$/)
    },

    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^anchorButton\s+(.*)$/)

      if (tokens[idx].nesting === 1) {
        return `<button class="l-button" onClick="location.href='${customMarkdownIt.utils.escapeHtml(m[1])}'">`
      } else {
        return '</button>\n'
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
        return `<a class="l-button" href='${customMarkdownIt.utils.escapeHtml(m[1])}'>`
      } else {
        return '</a>\n'
      }
    }
  })

module.exports = customMarkdownIt
