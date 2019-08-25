const markdownIt = require("markdown-it");
const markdownItKatex = require('@iktakahiro/markdown-it-katex');
const markdownItFootnote = require('markdown-it-footnote');
const markdownImplicitFigure = require('markdown-it-implicit-figures');
const markdownItContainer = require('markdown-it-container');
const markdownItAnchor = require('markdown-it-anchor');
//const markdownItPrism = require('markdown-it-prism');

//import Prism from "prismjs";
const Prism = require("prismjs");
const loadLanguages = require("prismjs/components/");
loadLanguages(['python', 'cpp', 'c', 'bash', 'django', 'git']);

// customize markdown-it
let options = {
  html: true,
  typographer: true,
  linkify: true,
  highlight: function (str, lang) {
    var languageString = "language-" + lang;
    if (Prism.languages[lang]) {
      return '<pre class="language-' + lang + '"><code class="language-' + lang + '">' + Prism.highlight(str, Prism.languages[lang], lang) + '</code></pre>';
    } else {
      return '<pre class="language-' + lang + '"><code class="language-' + lang + '">' + Prism.util.encode(str) + '</code></pre>';
    }
  }
};

var customMarkdownIt = markdownIt(options)
  .use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"})
  .use(markdownItFootnote)
  .use(markdownImplicitFigure)
  .use(markdownItContainer, 'note')
  .use(markdownItAnchor, {"permalink": true});
//  .use(markdownItPrism);

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

module.exports = customMarkdownIt;
//export default {customMarkdownIt};
