---
title: Customize Netlify CMS preview with Markdown-it and Prism.js
date: 2019-08-26T03:40:47.249Z
excerpt: >-
  In this post, I will demonstrate 1) How to write a simple React component for
  the post 2) How to use markdown-it and prism.js in the template, and 3) How to
  pre-compile the template and use it
tags:
  - javascript
---
This site is hosted on [Netlify](https://www.netlify.com/) and configured with built-in [Netlify CMS](https://www.netlifycms.org/). I usually would like to just write my post or other contents on this site using **vim** or other text editors. However, sometimes it is not possible to access my laptop and Netlify CMS allows me to write post anywhere instead of only on my laptop. I can just login https://www.guangshi.io/admin/ in my office computer and start editing. The post written and saved in the admin portal is directly pushed to a GitHub branch and I can then merge pull request to publish it. **Actually, this very post you are reading now is written and published using Netlify CMS admin portal.**

The Netlify CMS also provides a custom preview pane which reflects any editing in real-time. However, the default preview pane does not provide some functionalities I need, such as the ability to render math expression and highlight syntax in code blocks. Fortunately, the Netlify CMS provides [ways to customize](https://www.netlifycms.org/docs/customization/) the preview pane. One method `registerPreviewTemplate` is used to render a customized preview template. This method can take a React component as an argument and use this component to render the template. This allows me to incorporate `markdown-it` and `prism` directly into the rendering process.

![Editing in the Netlify CMS admin portal](https://tva1.sinaimg.cn/large/006y8mN6ly1g6dn4aya4nj31i90u0woe.jpg)

In this post, I will demonstrate,

* How to write a simple React component for the post
* How to use [markdown-it](https://github.com/markdown-it/markdown-it) and [prism.js](https://prismjs.com/) in the template
* How to pre-compile the template and use it

## A simple React component for custom preview

The simplest preview template would just render a title and the body of the markdown text. Thus, using the variable `entry` provided by Netlify CMS, the template can be written as the following,

```js
// Netlify CMS exposes two React method "createClass" and "h"
import htm from 'https://unpkg.com/htm?module';
const html = htm.bind(h); 
 
var Post = createClass({
  render() {
    const entry = this.props.entry;
    const title = entry.getIn(["data", "title"]);
    const body = entry.getIn(["data", "body"]);
 
    return html`
      <body>
        <main>
          <article>
            <h1>${title}</h1>
            <div>${body}</div>
          </article>
        </main>
      </body>
    `;
  }
});
```

In the example shown above, I use [**htm**](https://www.npmjs.com/package/htm) npm module to write `JSX` like syntax without need of compilation during build time. It is also possible to directly use the method `h` provided by Netlify CMS (alias for React's `createElement`) to write the render template, which is the method given in their [official examples](https://www.netlifycms.org/docs/customization/#registerpreviewtemplate). 

* `this.props.entry` is exposed by CMS which is a immutable collection containing the [collection data](https://www.netlifycms.org/docs/collection-types/) which is defined in the `config.yml`
* `entry.getIn(["data", "title"])` and `entry.getIn(["data", "body"])` access the collection fields `title` and `body`, respectively

## Use markdown-it and Prism.js in the template

The problem with the template shown above is that the variable `body` is just a raw string in markdown syntax which is not processed to rendered as `HTML`. Thus, we need a way to parse `body` and convert it into `HTML`. To do this, I choose to use [**markdown-it**](https://github.com/markdown-it/markdown-it). _It is however certainly possible to use other javascript-based markdown engines as well._ 

```js
import markdownIt from "markdown-it";
import markdownItKatex from "@iktakahiro/markdown-it-katex";
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

var customMarkdownIt = new markdownIt(options);
```

The above codes demonstrate how to `import` markdown-it as a module and how to configure it.

* I use [**markdown-it-katex**](https://www.npmjs.com/package/@iktakahiro/markdown-it-katex) to enable the ability to render math expression.
* I use [**prism.js**](https://prismjs.com) to perform the syntax highlighting. Note that the `highlight` part in the `options` allows the **prism.js** to add classes to code blocks and used for CSS styling (hence _highlighting_)

::: note
I recommend to use `import` to load the `prism.js` module in order to use [**babel-plugin-prismjs**](https://github.com/mAAdhaTTah/babel-plugin-prismjs) to bundle all the dependencies. I had trouble to get **prism.js** working in the browser using `require` instead of `import`.
:::

Now we have loaded the **markdown-it**, the `body` can be translated to `HTML` using,

```js
const bodyRendered = customMarkdownIt.render(entry.getIn(["data", "body"]));
```

To render `bodyRendered`, we have to use `dangerouslySetInnerHTML` which is provided by React to parse a raw `HTML` string into the DOM. Finally, the codes for the template are,

```js
var Post = createClass({
  render() {
    const entry = this.props.entry;
    const bodyRendered = customMarkdownIt.render(entry.getIn(["data", "body"]));

    return html`
    <body>
      <main>
        <article>
          <h1>${entry.getIn(["data", "title"], null)}</h1>
          <div dangerouslySetInnerHTML=${{__html: bodyRendered}}></div>
        </article>
      </main>
    </body>
    `;
  }
});

CMS.registerPreviewTemplate('posts', Post);
```

Note that there is a new line in the end. There, we use the method `registerPreviewTemplate` to register our template `Post` to be used for the CMS collection named `posts`.

## Pre-compile the template

Now, I have shown how to 1) write a simple template for the preview pane and 2) how to use **markdown-it** and **prism.js** in the template. However, the codes shown above cannot be executed in the browser since the browser has no access to the `markdown-it` and `prismjs` which live in your local `node_modules` directory. Here enters [**rollup.js**](https://www.npmjs.com/package/rollup) which essentially can look into the node module `markdown-it` and `prismjs`, and take all the necessary codes and bundle them into one big file which contains all the codes needed without any external dependency anymore. In this way, the code can be executed directly inside the browser. It is not complicated to set up **rollup.js**. First, write the config file,

```js
// rollup.config.js
const builtins = require('rollup-plugin-node-builtins');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const json = require('rollup-plugin-json');
const babel = require('rollup-plugin-babel');

export default {
  input: 'src/admin/preview.js',
  output: {
    file: 'dist/admin/preview.js',
    format: 'esm',
  },
  plugins: [
    nodeResolve({browser:true}),
    commonjs({ignore: ["conditional-runtime-dependency"]}),
    builtins(),
    json(),
    babel({
      "plugins": [
        ["prismjs", {
          "languages": ["javascript", "css", "markup", "python", "clike"]
        }]
      ]
    })
  ]
};
```

* `src/admin/preview.js` is the template code
* Set the format to be `esm` tells the **rollup.js** to bundle the code as an ES module.
* I use the [**babel-plugin-prismjs**](https://github.com/mAAdhaTTah/babel-plugin-prismjs) to first handle the dependencies of **prism.js**.

The perform the bundling, one can either use `rollup --config` in the terminal if **rollup.js** is installed globally or add it as a `npm` script. The config above tells the **rollup.js** to generate the file `dist/admin/preview.js`. 

To use the template, the final step is to include it as a `<script type=module>` tag. Add the following in your `admin/index.html`,

```html
<body>
  <script type=module src="/admin/preview.js"></script>
</body>
```
