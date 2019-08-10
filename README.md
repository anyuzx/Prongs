This file contains
* Notes on building this site using 11ty
* To-do list
* References

## Notes
### Initial setup
Adopting the good convention used by [^3][^4], I put all source files into a `src` directory. The global configuration file such as `.eleventy.js` and other files such as `package.json` is put in the root directory. For such file structure, we need to change the default setting of eleventy. Edit the `.eleventy.js` as such,

```js
// .eleventy.js
module.exports = function(config) {
  return {
    dir: {
      input: "src",
      output: "dist"
    }
  };
```

Currently, when you run `npx @11ty/eleventy` or `eleventy`, the existing `dist` directory will not be override but simply appended which will cause a problem. To start clean, you need to manually delete `dist` directory every time before you run `eleventy`. To make life simpler. you can add a script in the `package.json` file,

```json
{
  ...
  "scripts": {
    "dev": "rm -rf dist && npx @11ty/eleventy --serve"
  }
  ...
}
```

Then you can run `npm run dev` to delete the dist folder, build the site and start the server.

### Debug mode
It is convenient to add the following script in the `package.json` file.

```json
{
  ...
  "scripts":{
    "debug": "DEBUG=Eleventy* npx @11ty/eleventy --dryrun"
  }
  ...
}
```

Then you can simply run `npm run debug` to enable the debug mode of `eleventy`.

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

### How to display the word count?
To display the number of words for each post, I use the [filter](https://www.11ty.io/docs/filters/) functionality provided by `11ty`. A filter is basically a function which takes variable and output a result. In our case, the variable would be the string of the post and the output would be the number of words.

To save time, I use [`reading-time`](https://www.npmjs.com/package/reading-time) npm module to do the actual computation. All we need to do is just add the filter inside `.eleventy.js`,

```js
// .eleventy.js
// require the reading-time npm module
const readingTime = require('reading-time')

module.exports = function(config) {
  ...
  // add our filter to count words and compute reading time
  config.addFilter("readingTime", function(s) {
    return readingTime(s);
  }
  ...
}
```

Then inside our post layout file `_includes/layouts/post.njk`, we can add the following line,

```njk
<p>{{ (content | readingTime).words }} words {{ (content | readingTime).minutes | round }} mins read</p>
```

The output of `content | readingTime` is actually a object which contains the number of minutes, time in the unit of milliseconds and the number of words. We can obtain these values by wrap the object with a parenthesis and use `.` operator to refer the variable. Note that we also use `round` here, which is a builtin filter for Nunjucks to round the float number to a integer.

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

## To-do
- [x] Syntax highlight (options:[https://www.npmjs.com/package/@11ty/eleventy-plugin-syntaxhighlight](https://www.npmjs.com/package/@11ty/eleventy-plugin-syntaxhighlight))
- [x] enable Katex
- [x] enable typography.js
- [x] use tailwindcss
- [ ] home page (newly updated content + latest news)
- [ ] reduce some variable to global variables for easier maintenance
- [ ] Progressive image
- [ ] css pipeline (css compile + purgecss)
- [ ] js pipeline
- [ ] image resize/optimization pipeline
- [ ] Bundle optimization
- [ ] add tags navigation for posts index page
- [ ] allow video used as header media for post
- [ ] return to top button
- [ ] add similar posts section for individual post page
- [ ] directly embedding github gist
- [ ] allow photo collection based on EXIF information

## References
[^1] Design inspiration #1: https://macwright.org/
[^2] Design inspiration #2: https://www.pborenstein.com/
[^3] 11ty example #1: https://github.com/philhawksworth/eleventyone
[^4] 11ty example #2: https://github.com/andybelldesign/hylia
