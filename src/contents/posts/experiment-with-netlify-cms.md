---
title: Customize Netlify CMS preview with Markdown-it and Prism.js
date: 2019-08-26T03:40:47.249Z
excerpt: ''
tags:
  - javascript
---
This site is hosted on [Netlify](https://www.netlify.com/) and configured with built-in [Netlify CMS](https://www.netlifycms.org/). I usually would like to just write my post or other contents on this site using **vim** or other text editors. However, sometimes it is not possible to access my laptop and Netlify CMS allows me to write post anywhere instead of only on my laptop. I just login `https://www.guangshi.io/admin/` in my office computer and start editing. The post written and saved in the admin portal is directly pushed to a github branch and I can then merge pull request to publish it.

The Netlify CMS also provides a custom preview pane which reflects any changes in run time. However, the default preview pane does not provide some functionalities I need such as the ability to render math expression and highlight syntax in code blocks. Fortunately, the Netlify CMS provides [ways to customize](https://www.netlifycms.org/docs/customization/) the preview pane. One method `registerPreviewTemplate` is used to render customized preview template. This method can takes a React component as an argument and use this component to render the template. This allows me to incorporate `markdown-it` and `prism` directly into the rendering process.

In this post, I will demonstrate

* How to write a simple React component for the post
* How to use [markdown-it](https://github.com/markdown-it/markdown-it) and [prism.js](https://prismjs.com/) in the template

## A simple React component for custom preview

