const markdownIt = require("markdown-it");
const markdownItKatex = require('@iktakahiro/markdown-it-katex');
const markdownItFootnote = require('markdown-it-footnote');
const markdownImplicitFigure = require('markdown-it-implicit-figures');
const markdownItContainer = require('markdown-it-container');
const markdownItAnchor = require('markdown-it-anchor');
const markdownItEmoji = require('markdown-it-emoji');
const markdownItSub = require('markdown-it-sub');
const markdownItSup = require('markdown-it-sup');
const markdownItIns = require('markdown-it-ins');
const markdownItMark = require('markdown-it-mark');
const markdownItAbbr = require('markdown-it-abbr');

const hljs = require("highlight.js");

// customize markdown-it
let options = {
  html: true,
  typographer: true,
  linkify: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return '<pre class="hljs"><code>' + hljs.highlight(lang, str, true).value + '</code></pre>';
      } catch (_) {}
    }
    return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
  }
};

var customMarkdownIt = new markdownIt(options);

customMarkdownIt
  .use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"})
  .use(markdownItFootnote)
  .use(markdownImplicitFigure, {
    figcaption: true
  })
  .use(markdownItContainer, 'note')
  .use(markdownItContainer, 'collapse', {
    validate: function(params) {
      return params.trim().match(/^collapse\s+(.*)$/);
    },
    render: function (tokens, idx) {
      var m = tokens[idx].info.trim().match(/^collapse\s+(.*)$/);
      if (tokens[idx].nesting === 1) {
        // opening tag
        return '<details><summary>' + customMarkdownIt.renderInline(m[1]) + '</summary>\n';
      } else {
        // closing tag
        return '</details>\n';
      }
    }
  })
  .use(markdownItAnchor)
  .use(markdownItEmoji)
  .use(markdownItSub)
  .use(markdownItSup)
  .use(markdownItIns)
  .use(markdownItMark)
  .use(markdownItAbbr);

/*
// Remember old renderer, if overridden, or proxy to default renderer
var defaultRender = customMarkdownIt.renderer.rules.link_open || function(tokens, idx, options, env, self) {
  return self.renderToken(tokens, idx, options);
};

customMarkdownIt.renderer.rules.link_open = function (tokens, idx, options, env, self) {
  // If you are sure other plugins can't add `target` - drop check below
  var aIndex = tokens[idx].attrIndex('target');

  if (aIndex < 0) {
    tokens[idx].attrPush(['target', '_blank']); // add new attribute
  } else {
    tokens[idx].attrs[aIndex][1] = '_blank';    // replace value of existing attr
  }

  // pass token to default renderer.
  return defaultRender(tokens, idx, options, env, self);
};
*/

module.exports = customMarkdownIt;
