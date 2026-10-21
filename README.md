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

* Requires Node.js `>=22.13.0`; Netlify uses Node 22. The optional Critical CSS tool also requires this version.
* Run `npm test` to check photo refresh, font delivery, service-worker loading, and CSS/SVG build compatibility.
* `npm run build` and `npm run build:development` use cached remote data for publications/photos.
* Netlify runs `npm run build:netlify`: it runs the test suite, then attempts to refresh remote data but can deploy using the committed photo cache if Cloudinary is unavailable or rate-limited. The build logs the reason and cached photo count. Photo changes appear after a successful refresh.
* Run `npm run build:refresh-data` for an explicit refresh of publication and photo data. This command stays strict: a failed Cloudinary request fails the build. Commit updated JSON caches after a successful local refresh so future deployments have a current fallback.
* Photo refreshes reuse embedded image metadata for unchanged asset versions; only new or replaced images require individual metadata requests. Tags and captions still refresh from the resource listing. Failed or empty refreshes do not replace the existing cache, and builds fail if neither remote data nor a usable photo cache is available.
* Run `node --test tests/getPhotos.test.js` to check photo refresh and fallback behavior without making external API requests.
