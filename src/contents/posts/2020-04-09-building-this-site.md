---
slug: building-this-site
title: Making this site
date: 2020-04-09
disableKatex: true
excerpt: "This site was built around September 2019. Two months before then, I knew absolutely nothing about Javascript, HTML, and CSS. Now I can say I know something about HTML and CSS and still too little about Javascript."
tags:
    - javascript
---

*[SPA]: single-page application

This site was built around September 2019. Two months before then, I knew absolutely nothing about Javascript, HTML, and CSS. Now I can say I know something about HTML and CSS and still too little about Javascript.

Looking back, the design principles of this site are the following,

* Minimal design in its looks

* Performant, i.e. fast page load

I hope I have these principles in mind before I started to learn to build a website, that would save me a lot of time...

The first thing I did is to learn how to use [Jekyll](https://jekyllrb.com/). I heard of Jekyll a long time ago when I know nothing about front-end, back-end, javascript, web development, and many others. Following this direction, I found the [minimal-mistake](https://mmistakes.github.io/minimal-mistakes/) starter which is an excellent site template. I recalled that maybe after only several days I successfully got my site running on GitHub page. However, I was not satisfied with the look of the site. Then I started to learn CSS and HTML and tried [Bulma](https://bulma.io/) to customize the looks of the site. During this process, I was exposed to Javascript and front-end development world. I started to notice all these buzzwords, SPA, reactivity, React, Vuejs, Gatsby and many others, and started to look for other options of building a website. After somewhat amount of research, I landed on [Nuxt.js](https://nuxtjs.org/). Retrospectively, the reason I chose it is actually pretty dumb. It is just because that I can at least understand [Vue.js](https://vuejs.org/) a little bit compared to the learning experience of React.

Starting from scratch, *very slowly*, I started to build my personal site using Nuxt.js. I quickly realized that it might not be suitable for my purpose. There are mainly two reasons for this:

* There is no standard or easy way to incorporate the content from my markdown files to the page rendering. All the methods I found online feel like a hack and it suffers the problem of loading all the posts together for every single page! This issue is also addressed [in this blog post](https://suxin.space/notes/nuxt-bloated-markdown-blogs/).

* Although nuxt.js does have a static site generation mode, the pre-rendered page bundle still includes a bunch of client-side Javascript codes, which in my case are not necessary at all. These client-side JS are there for so-called hydration which take over the site once the first-load is completed. However, for my personal site on which 99% percent of the pages is just static content, these JS are **100%** unnecessary. It also makes the site bloated significantly, an aspect I hate. Unfortunately, at least currently, there is [no **full** static generation mode](https://github.com/nuxt/rfcs/issues/22#issuecomment-563274603).

The second reason is the one which eventually leads to me realizing that using a JS framework based static site generator is really not a good choice for my purpose. However, during the process, I started to learn the richness of JS community and the existence of millions of packages (might be too many). Thus I do want to stick to Javascript. Then I came across [11ty](https://www.11ty.dev/), which I quickly realized is a very suitable tool for my purpose and taste.

* First, it is **not** a framework, a point also emphasized on their website. Thus there is no unnecessary client-side Javascript generated by the framework. It also means you don’t need to write framework-specific codes.

* Second, similar to Jekyll, it put all your contents into `collections` which can then be used and referred anywhere in the templates.

* Third, Eleventy has a powerful functionality called [JavaScript Data Files](https://www.11ty.dev/docs/data-js/) which allows one to be able to get any data into the build process (as long as you can write it in JavaScript). For instance, [retrieving the bibliographic information from a DOI and use them in the template/layouts](/posts/automatic-publication-page/)

With the limited knowledge of Javascript I learned from trying Nuxt.js and the help from a few starter source codes [^1][^2][^3], it didn't take much time for me to set up this site using 11ty and get it running [^4].

As for the design of this site, I am heavily influenced by Tom MacWright's [personal site](https://macwright.org/). I hope to talk about this more in details in the future. For this site's CSS, I end up choosing the [tailwindcss](https://tailwindcss.com/) since it is a low-level CSS framework, which allows me to acheive the look I want without much effort.

I guess the lesson I learned is, **do not make things overcomplicated**.

[^1]: https://github.com/11ty/eleventy-base-blog
[^2]: https://github.com/philhawksworth/eleventyone
[^3]: https://github.com/hankchizljaw/hylia
[^4]: The source code of this site is on [github](https://github.com/anyuzx/Prongs)
