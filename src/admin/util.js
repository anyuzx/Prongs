import markdownIt from "markdown-it";
import markdownItKatex from "@iktakahiro/markdown-it-katex";
import markdownItFootnote from "markdown-it-footnote";
import markdownImplicitFigure from "markdown-it-implicit-figures";
import markdownItContainer from "markdown-it-container";
import markdownItAnchor from "markdown-it-anchor";

import Prism from "prismjs";

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

var customMarkdownIt = new markdownIt(options)
  .use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"})
  .use(markdownItFootnote)
  .use(markdownImplicitFigure)
  .use(markdownItContainer, 'note')
  .use(markdownItAnchor, {"permalink": true});

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

//module.exports = customMarkdownIt;
export default customMarkdownIt;
