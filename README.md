[![Netlify Status](https://api.netlify.com/api/v1/badges/37ea660e-25ff-45dc-ba7a-44afaa8dec09/deploy-status)](https://app.netlify.com/sites/guangshi/deploys)

> This file is in construction :construction:

This documentation mainly serves for self use. However, I hope anyone interested at building static site using Eleventy can find some useful information here. The following aspects are addressed in this file,

* Instructions for using this site
* Notes of building this site
* References/Resources

## Instructions
---
### Files
The root directory contains the following,

* `.eleventy.js` The essential configuration file for Eleventy.
* `tailwind.config.js` The tailwindcss configuration file
* `postcss.config.js` The PostCSS configuration file.
* `criticalCSS.js` The script to run [**critical**](https://github.com/addyosmani/critical)
* `rollup.config.js` Configuration file for Rollup.
* `src` Directory containing templates, layouts, markdown files and assets
  * `_data` Global data files
  * `_includes`
    * `css` CSS files
      * `main.css` Main CSS styles
      * `atom-one-light.css` Style file for code
      * `typeset.css` A minimal CSS file used for **typeset**
    * `js` Javascript utilities
      * `getCategories.js` Used for generating Eleventy collection based on the front-matter entry `category`
      * `getPhotos.js` Used for generating Eleventy collection for photos uploaded on Cloudinary
      * `getTagList.js` Used for generating Eleventy collection for all tags
      * `html-minify.js` Used for HTML minification (post-processing)
      * `mdRender.js` Customized markdown-it parser
      * `openPostExcerpt.js` A small JS code needed to be included in the page to open post excerpt
      * `service-worker.js` Template file for service worker. Used together with `service-worker.njk`
      * `typeset.js` Post-processing generated HTML files with [**Typeset**](https://github.com/davidmerfield/Typeset)
      * `typography.js` Configure [**typography.js**](https://github.com/KyleAMathews/typography.js)
    * `layouts` Template files
      * `base.njk` Base layout (common elements for all pages)
      * `default.njk` Default layout
      * `home.njk` Front page layout
      * `photo.njk` Single photo page layout
      * `photos.njk` Photos page layout
      * `post.njk` Single post page layout
      * `posts.njk` Posts page layout
      * `research.njk` Research page layout
      * `tags.njk` Single tag page layout
    * `partial` Also template files. Used for included in the main template file in `/layouts`
      * `_footer.njk` Page footer
      * `_nav.njk` Main navigation
      * `_postList.njk` Macro for listing posts
    * `svg` All SVG files (icons, logo)
  * `admin` Files for Netlify CMS
    * `config.yml` Configuration file for Netlify CMS
    * `preview.js` Preview template for Netlify CMS
    * `util.js` Javascript utility
  * `assets`
    * `favicon` All favicon files
    * `images` Image files (not photography images)
  * `contents` Textural content files
    * `posts` Markdown files for posts
    * `research` Markdown files for research projects
  * `pages` Page templates
    * `about.md` About me page (`/about`)
    * `admin.njk` Netlify CMS admin portal (`/admin`)
    * `photo.njk` Individual photo page. *Eleventy pagination*
    * `photos.njk` Photos front page (`/photos`)
    * `publication.md` Publication page (`/publication`)
    * `research.md` Research page
    * `tags.njk` Individual tag page. *Eleventy pagination*
  * `404.njk` 404 Error page
  * `feed.njk` RSS Feed page
  * `index.md` Main front page
  * `service-worker.njk` Template for generating service workers (with `/_includes/js/service-worker.js`).
  * `site.webmanifest`

### NPM script

To build the site, run

``` bash
npm run build
```

Some other commands

* `npm run build:development` Build the site without running HTML minification, PurgeCSS and criticalCSS.
* `npm run 11ty:debug` Debug mode.
* `npm run cms:bundle` Run **rollup** to bundle the files needed for Netlify CMS

### How to set navigation items

### How to add a post

### How to customize the style

### How to edit site-wise data

### How to customize markdown-it parser

## Notes
---
### Displaying posts index page
We want to collect all posts files in a subdirectory inside `src`, and display it on the page `/posts`. To do this, the most easy way is to add collection is using the config API `getFilteredByGlob` provided by `eleventy`,

```js
module.exports = function(config) {
  // Filter source file names using a glob
  config.addCollection('posts', function(collection) {
    return collection.getFilteredByGlob('contents/posts/*.md');
  });
};
```

### Change permalink for posts
In my case, I put all the posts inside directory `contents/posts/`. Be default, the post will has a url like `.../contents/posts/post1` which is not what I want. I prefer not to have `contents` in the url. To change the default behavior, we need to manually set the permalink for each post. Add a permalink attribute in the front matter like the following,

```md
---
permalink: posts/{{ page.fileSLug }}/index.html
---
```

### Displaying a single post
Here I describe basic procedure to display a single post. Since all of our posts locate in a single place `contents/posts/`, it is a good practice to create a directory-level data file `posts.json` inside `contents/posts/`. The data inside this file will be available to all of our post files inside `contents/posts/`. Edit `posts.json` to include the layout,

```json
{
  "layout": "layouts/post.njk"
}
```

Now let's create a layout file named `post.njk` inside the directory `_includes/layouts`. The content of our layout `post.njk`

```njk
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title> {{ title }}</title>
  </head>
  <body>
    <h1>{{ title }}</h1>
    <p>{{ date }}</p>
    <p>tags:
    {%- for tag in tags %}
      {{ tag }}
    {% endfor -%}
    </p>
    <hr>
    {{ content | safe }}
  </body>
</html>
```

Notice that we use `title`, `data`, `tags` variables here. All of these variables are defined inside the front matter inside the individual post file.

### How to include tailwind CSS
In my case, I create a subdirectory `_includes/styles/` and create `main.css`. The content of `main.css` is the following,

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Use the CLI tool provided by tailwind to generate the final css file,

```bash
npx tailwind build main.css -o output.css
```

Once we have our css file generated, we need to refer it in our layout. We can do the following,

```njk
<link rel="stylesheet" type="text/css" href="/_includes/styles/output.css">
```

However, by default, eleventy will try to parse the files inside directory `_includes/styles` as templates. We need to let eleventy know that we just want this directory directly copied to the `dist` folder. To do this, we need to add the following inside the `.eleventy.js` file,

```js
config.addPassthroughCopy("src/_includes/styles")
```

### How to use Katex with eleventy?
Edit `.eleventy.js` to config Katex.

```js
const markdownIt = require("markdown-it");
const markdownItKatex = require('@iktakahiro/markdown-it-katex');

module.exports = function(config) {
  // customize markdown-it
  let options = {
    html: true,
    typographer: true,
    linkify: true
  };

  config.setLibrary("md", markdownIt(options).use(markdownItKatex, {"throwOnError" : false, "errorColor" : " #cc0000"}))
}
```

In addition to this, one also need to include katex css file. Refer to official site for the details of link css.

### How to use Typography.js in eleventy project?
[Typography.js](https://github.com/KyleAMathews/typography.js/) is a javascript tool to style text content. It calculates the line height, different sizes for different heading using math. It provides a API to generate raw string of the CSS styles. We can use this API to inject the CSS directly into our page. To do this, we need to be able call the typography.js function inside our page template. There are several ways to achieve this, in this article, I will put the typography.js function in a global data file. 

Create a file named `typography.js` inside the directory `_data` and fill it with content,

```js
const Typography = require('typography')
const TypographyBootstrap = require('typography-theme-bootstrap').default

const typography = new Typography(TypographyBootstrap)

module.exports = {
  typography
}
```

Since this file is inside the directory `_data`, it becomes available to all layouts and templates in eleventy (This is why I love eleventy! It is just comment sense and straightforward). Now we can inject the css into our layout,


```njk
<head>
  ...
  <style type="text/css">
  {{ typography.typography.toString() | safe }}
  </style>
  ...
</head>
...
```

`.toString` method will generate CSS as a raw string which is exactly what we want. Note that we also use the builtin filter `safe` to escape the string so that the string will be injected into the page as it is.

### How to *highlight* navigation item for the current page?
Let's say we have a navigation bar whose items are `about` and `posts`. When the user is on the page `about`, we want the item in the navigation bar to be *highlighted*. To achieve this, we can define a new class to style the item and attach this class when the page is navigated to. The usual method is use some javascript code to detect the current `url` and toggle the class name depending on the value of the `url`. We can cerntainly do this. But if we want to no js code, we can also tell the template engine to generate different navigation bar depending on which page it is generating. Let's say we create a template for navigation,

```njk
...
  {% if page.url.startsWith(nav.url) %}
    <a class="active-nav" href="{{ nav.url }}">{{ nav.title }}</a>
  {% else %}
    <a class="unactive-nav" href="{{ nav.url }}">{{ nav.title }}</a>
  {% endif %}
...
```

Here we use the builtin variable `page.url` to access the url of the current page and check wether it starts with the url of our navigation item. If the condition is evaluated to be true, then we add a `active-nav` class to the `<a>` tag, otherwise a class `unactive-nav` is added.

### How to enable tags page?

Refer to this [page](https://www.11ty.io/docs/quicktips/tag-pages/) on how to create a tag page.

### Use PurgeCSS

### Use CriticalCSS

### Use typeset.js

### HTML minification

### Set up photography page