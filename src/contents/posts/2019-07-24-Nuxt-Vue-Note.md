---
title: "My note on learning Nuxt.js and Vue.js"
date: 2019-07-24
excerpt: "This note is about Nuxt.js, Vue.js (and many others such as Bulma). This note is incrementally built along the process of building a personal website using these three tools/frameworks. The content of this note will be mainly about the tips and details I consider important or those I find not easy to googling answers for."
categories:
  - code
tags:
  - javascript
  - front-end
image: /assets/images/R0000768.jpg
disableKatex: true
---

This note is about [Nuxt.js](https://nuxtjs.org), [Vue.js](https://vuejs.org/) and [Bulma](https://bulma.io/). This note is incrementally built along the process of building a personal website using these three tools/frameworks. The content of this note will be mainly about the tips and details I consider important or those I find not easy to googling answers for.

---

## How to add favicon using Nuxt?

### How to generate favicon?
There are many online tools you can use to generate favicon. I use [this site](https://realfavicongenerator.net/).

### Where to put favicon?
Nuxt provide two folders where you can put assets into, `assets` and `static`. All the files inside `assets` folder will be processed by Webpack. For instance, if you put a `sass` file inside `assets`, it will be compiled to standard `css` file by Webpack. On the other hand, `static` folder is not touched by Webpack and any files inside the `static` folder can be accessed by the root directory `/`. For instance, the file `my-image.png` inside `static` folder can be accessed by `your-site-url/my-image.png`.

I may be wrong, but I found that the favicon files can only be put in the `static` folder since any files put in `assets` folder will be renamed. Thus when referring the favicon in the `header` section in the `html` file, those favicon files cannot be found.

To achieve better management, it is better to create a folder specifically for favicon. It is not clear in the official Nuxt documentation, but it is perfectly okay to create subfolder under `static` or `assets`. Here I create a subfolder named `favicon` under the `static` folder. All the files put inside this `static/favicon` folder can be accessed using the path `/favicon/`.

### How to use favicon?
The favicon files are referred in the `header` section in a `html` file. In Nuxt, we can add any custom header content globally by adding them in `nuxt.config.js`. The favicon can be added to the site by including the following in the `nuxt.config.js`.

``` js
export default {
  head: {
    meta: [
      { name: 'msapplication-TileColor', content: '#2b5797' },
      { name: 'theme-color', content: '#ffffff' }
    ],
    link: [
      { rel: "apple-touch-icon", sizes: "180x180", href: '/favicon/apple-touch-icon.png' },
      { rel: "icon", type: 'image/png', sizes: '32x32', href: '/favicon/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon/favicon-16x16.png' },
      { rel: 'manifest', href: '/favicon/site.webmanifest' },
      { rel: 'mask-icon', href: '/favicon/safari-pinned-tab.svg', color: '#5bbad5'}
    ]
  }
}
```

Note that the actual keywords and their values shown in the code above is what [realfavicongenerator](https://realfavicongenerator.net/) specifies.

### Notes
Notice that in the code we added to `nuxt.config.js`, the path for the favicon files needed to be specified. Whatever path you specify in the `nuxt.config.js` head section is fixed. However if you put favicon files inside `assets` folder, their names and paths will be changed by Webpack and thus they cannot be found by the `href` links provided in the `nuxt.config.js`. Hence, favicon files can only be put inside the `static` folder but not `assets` folder.

---

## How to use Google Web Font?
Example: simply add the following code to `nuxt.config.js`

``` js
export default {
  link: [
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css?family=Oswald:300,400,500|Source+Sans+Pro:400,400i,700,700i&display=swap' }
  ]
}
```

### Notes
There can be only one `export default` inside `nuxt.config.js`.

---

## How to use Mathjax with Nuxt?

---

## How to use Bulma sticky navbar with nuxt/vue?

### How to create a navbar Vue component
Since the navbar probably will be used through most of the pages on the website, it is better to create a Vue component for our navbar which can utilized in any page easily. This is relatively easy, just create a Vue component. For instance, create a file named `TheNavbar.vue` whose content is,

``` js
<template>
<!-- your navbar here -->
</template>

<script>
export default {
  data () {
    return {
      navbaritems: [
        {
          id:0,
          name:'page1',
          link:'/page1'
        },
        {
          id:1,
          name:'page2',
          link:'/page2'
        }
      ]
    }
  }
}
</script>
```

In the example given above, we also define a list `navbaritems` which is used to generate navigation items in the navbar. Use `v-for` to loop through the list `navbaritems` and for each item in the list, its attributes can be accessed by `.id`, `.name`, or `.link`.


### How to make it sticky?
Since in Bulma, if we want to make navbar sticky (that is always visable at the top of the page), the class `is-fixed-top` needed to be added for the `navbar` element. In addition, additional class needed to be added for `body` element. Furthermore, if you want to use hero page with fullheight, you also need to add class `is-fullheight-with-navbar` to `section` element. Hence, it would be good practice to use a boolean variable to indicate whether the navbar is sticky or not and if it is sticky additional class can be added to other parts of page.

Since we need to modify other partS of the page if the navbar is sticky, navbar now is no longer a independent component. If we define whether it is sticky inside `TheNavbar.vue`, it will be difficult to communicate with other parts of the page. Hence, it is better to define the *stickyness* for each page instead. For instance, if we want to enable the sticky navbar for our `home` page, we can use the following code,

``` js
<template>
<v-navbar v-bind:class="{'is-fixed-top':hasStickyNavbar}"></v-navbar>
<!-- some other codes -->
</template>

<script>
import TheNavbar from '~/components/TheNavbar'

export default {
  name: 'app',
  components: {
    'v-navbar': TheNavbar
  },
  data () {
    return {
      hasStickyNavbar: false
    }
  },
  mounted() {
    document.body.classList.toggle('fixed', this.hasStickyNavbar);
  }
}
</script>
```

In the code shown above, we use variable `hasStickyNavbar` to specify whether the navbar is sticky. Since Vue does not allow the direct manipulation of `body` element, we need to utilize the `mounted()` function to execute a vanilla js code. Inside the `mounted()` function, the line `document.body.classList.toggle('fixed', this.hasStickyNavbar)` adds the class `fixed` to `<body>` tag if the `hasStickyNavbar` is evaluated to be `true`. The `mounted()` execute the js code once the page is mounted.

---

## How to navigate to anchor in Vue/Nuxt?

### Easy method
If you want to make a link anchored to a specific part of the page, you can use `id` attribute to mark the part of the `html` code you want to link to. The Vue.js way to do this is to use the module [vue-scrollto](https://vue-scrollto.netlify.com/). Simply do the following,

``` html
...
<button v-scroll-to="'#marked-section'">Button</button>
...

...
<div id="marked-section">
</div>
...
```

If the button is clicked, the page will automatically navigate to the `div` marked by the `marked-section`. This module can be easily used with `nuxt.js`. Refer to their documentation [here](https://vue-scrollto.netlify.com/docs/)

### Is there a way to achieve this using `vue-router`?
Apparently, this is not easy to do. Refer to these links,

* [How to handle anchors (bookmarks) with Vue Router?](https://forum.vuejs.org/t/how-to-handle-anchors-bookmarks-with-vue-router/14563)
* [anchors do not work](https://github.com/nuxt/nuxt.js/issues/5359)
* [Navigation to the same route fails (anchor, hash)](https://github.com/vuejs/vue-router/issues/1668)

**Possible workaround**:

[vue-anchor-router-link](https://www.npmjs.com/package/vue-anchor-router-link)

---

## How to set up contact form?

### Easy way
Use Netlify to server the site, and use the form ability provided by Netlify.

## How to load image dynamically from local directory?

### The problem
Suppose we want to build a photography portofolio page which shows cover image for each photo album. Click each album will leads to a new page which shows all the photos from that album. Let's say we organize our photos in the directory like the following, `contents/gallery/album1`, `contents/gallery/album2` ... Now, the question is how should we load these images in our site? One brutal way is to hand code each individual image in the page. Obviously, we don't want these.

Then I thought I can just use modules like `fs` or `glob` to obtain the local path for each image and then use the path to load images. But there are two problems, 

* node-specific module like `fs` or `glob` doesn't work on client. So one can only use them inside the built-in `asyncData` method within a `if (process.server) {}` statement. However, `asyncData` is only called once on server side when the page first load, thus `fs` or `glob` is only called on refreshing the page but not through the navigation using `nuxt-link`. 

* images needed to be first imported by webpack. This becomes a problem when using dynamic route. In this example, each album is a dynamic route and we want to load images from particular album based on the route name. However, since we don't know the file path first hand, we cannot load images we want to. One might think about using webpack function `require.context` to import all the images in the album. Unfortunately, `require.context` only works with literal path and our dynamic route simply wont' work. One workaround is simply import all the images under the directory `contents/gallery` using `require.context` and then we can find the url for each image using its local paths/names (this will work if you don't have dynamic route and simply want to load all the images, see https://stackoverflow.com/questions/53993252/dynamically-get-image-paths-in-folder-with-nuxt, and https://gist.github.com/Atinux/03e0d471ee7c6439209832ff94aa3017). However, even after this, we have the first problem, which leads to a unusable page.

After browsing the internet, I encounter [this stackoverflow question](https://stackoverflow.com/questions/54040683/nuxt-module-not-found-error-cant-resolve-fs), the answer for this question suggests using a express middleware to create a custom API to obtain image names and use `axios` to call the API inside `asyncData` method inside our page component. This method works well for SSR but simply won't work for static site when using `nuxt generate`. The reason is that for our statically generated site, there is no server to serve our custom API anymore. Nevertheless, I supply the examplary code for this method.

* create a directory called `api` inside the root directory of nuxt application. Inside `api`, create a file named `index.js`.

```js
//index.js
const express = require('express')

// Create express instance
const app = express()

// Require API routes
const gallery = require('./routes/gallery')

// Import API routes
app.use(gallery)

// Export the server middleware
module.exports = {
  path: 'api/',
  handler: app
}
```

* create a folder named `routes` inside `api`, and create a file named `gallery.js` inside directory `routes`

```js
// gallery.js
const { Router } = require('express')
// require glob
const glob = require('glob')
// require cors
const cors = require('cors')

const router = Router()

router.get('/gallery/albums', cors(), function(req, res) {
  // initialize array for albums
  const albums = []
  // obtain names for albums
  const albumNames = glob.sync('*', { cwd: './contents/gallery' })
  // add cover image for each album
  let idx = 0
  albumNames.forEach(function(albumName) {
    // cover image has file name as *.cover.jpg(png|tiff|gif|jpeg)
    const albumCover = glob.sync(
      albumName + '/*.cover.@(jp?(e)g|png|tiff|gif)',
      { cwd: './contents/gallery' }
    )
    // add attribute name, cover, slug and id
    albums.push({
      name: albumName,
      cover: albumCover[0],
      slug: albumName,
      id: idx
    })
    idx += 1
  })
  res.json(albums)
})

router.get('/gallery/albums/:album', cors(), function(req, res) {
  const albumPhotos = []
  const albumPhotoNames = glob.sync(
    `${req.params.album}/*[!(min|placeholder)].@(jp?(e)g|png|tiff|gif)`,
    { cwd: 'contents/gallery/' }
  )
  let idx = 0
  albumPhotoNames.forEach(function(albumPhotoName) {
    albumPhotos.push({
      name: albumPhotoName,
      id: idx
    })
    idx += 1
  })
  res.json(albumPhotos)
})

module.exports = router
```

* in the `nuxt.config.js`, add our serverMiddleware as the following,

```js
...
export default {
  ...
  serverMiddleware: [
    '~/api/index.js'
  ],
  ...
}
...
```

* in the page component (let's say `pages/gallery/index.vue`), we can obtain the file names like this,

```js
export default {
  ...
  async asyncData({ app }) {
    // use axios to get cover image for each album
    const albums = (await app.$axios.get('/api/gallery/albums')).data
    return { albums }
  },
  ...
}
```

Now variable `albums` is a array in which each element is a object which contains album name, album slug, album index and album cover image path/name. Then we can finally load our image using something like this 

```html
<template>
 <div v-for="album in albums">
  <img :src="require('~/contents/gallery/' + album.cover)" />
 </div>
</template>
```

---

Now we have successfully managed to 1) create our custom express API 2) use axios to fetch data from the API 3) display images using the fetched data. However, since this method relies on a express server, it cannot work for staic generated site using `nuxt generate`. The reason is that the static page will try to fetch data from the express API which does not exist. Thus you will run into error of unable to fetch data. One way around this is that one can run server by using `nuxt start` and then server our static pages using something like `http-server`. However this way completely defeats our purpose of generating static site ...After browsing the internet, I encounter this github discussion https://github.com/nuxt/rfcs/issues/22. From that issue, I found out a nuxt module [nuxt-payload-extractor](https://github.com/DreaMinder/nuxt-payload-extractor). Using this module, I managed to get the static site work as intended. The solution is very simple. The following is the code,

```js
// pages/gallery/index.vue

...
export default {
  async asyncData({ app, $payloadURL, route }) {
    // this part does the work
    // payload.json will be loaded from client side. Thus the API call to the server is avoided
    if (process.static && process.client) {
      return { albums: (await app.$axios.get($payloadURL(route))).data.albums }
    }
    
    // same code here as above. This part is actually only called during the generating process.
    const albums = (await app.$axios.get('api/gallery/albums')).data
    return {albums}
  }
}
...

```

However the problem of this approach is that during the generating of using `nuxt generate`, we need to start our nuxt server at the same time by doing `nuxt start`. This extra step becomes a problem if we want to deploy the site to Netlify or Github. As a conclusion, we need to think about other methods.


### The solution for static site
As explained above, fetch our image dynamically using a express server middlware does not work for static site. The solution I came to is inspired by this github issue https://github.com/nuxt/nuxt.js/issues/1949 and this blog post https://joshuastuebner.com/blog/backend/nuxt_static.html#code-example. The basic idea of the solution is that,

* Save all the data acquired by API to a .json file
* Require/import the .json file in the page component needed

The most straighforward to achieve this is to write a script to generate .json file. We run this script manually before build/generating our nuxt app. However, if we want this process integrated inside nuxt build process, we need to write our own nuxt module. Following the example prestented in the above github issue and blog, I write my own module code.

```js
import {PythonShell} from 'python-shell'

module.exports = function preProcess() {
  const generateJson = function() {
    return new Promise((resolve, reject) => {
      PythonShell.run('gallery.py', { args:['--json', 'data/gallery.json'] }, function (err, results) {
        if (err) {
          reject(err)
        } else {
          console.log(results)
          resolve(results)
        }
      })
    })
  }

  // add hook for build
  this.nuxt.hook('build:before', async builder => {
    await generateJson()
  })
}
```

Save the above code in a file `module/preProcess.js`. Here, I use `python-shell` to call a python script in `node.js`. Since I am more familiar with python, I write the script in python to pre-process the gallery image and generate a `.json` file containing information of paths of images. The modules above use the hook provided by nuxt `build:before` which basically tell nuxt to run our `generateJson()` before the build process. Notice that the function `generateJson` return a promise and we use async/await combination inside the hook. This is required by nuxt to tell nuxt wait for our script finished to continue to the next step.
