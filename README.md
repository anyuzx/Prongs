[![Netlify Status](https://api.netlify.com/api/v1/badges/37ea660e-25ff-45dc-ba7a-44afaa8dec09/deploy-status)](https://app.netlify.com/sites/guangshi/deploys)

# Personal Site

This repository containts the source code for my personal site. The site is built with Eleventy static site generator.

## Features

* sitemap
* service worker
* inline Purged CSS styles
* HTML minification
* Photo page with responsive image (using Cloudinary)
* Netlify CMS with support of custom syntax highlight and math equation
* Math equation support using Katex
* RSS feed
* Image Lazy Loading
* Automatc publication page generated from a list of DOI

## Development Notes

* Requires Node.js `>=18` (Eleventy 3.x requirement).
* `npm run build` and `npm run build:development` use cached remote data for publications/photos.
* Run `npm run build:refresh-data` when you want to refresh publication and photo data from external APIs.
