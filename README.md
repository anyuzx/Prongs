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
* Per-paper Google Scholar citation counts and official Altmetric badges

## Development Notes

* Requires Node.js `>=22.13.0`; Netlify uses Node 22. The optional Critical CSS tool also requires this version.
* Run `npm test` to check photo refresh, font delivery, service-worker loading, and CSS/SVG build compatibility.
* Security overrides keep all `lodash` and `serialize-javascript` copies on patched releases, including versions pinned by older build tools. The tests also exercise their injection protections through each consuming package.
* Workbox 7.4.1 uses Rollup 4. The unused `netlify-plugin-a11y` package was removed to eliminate its obsolete Puppeteer/archive-extraction dependency chain; the Netlify Lighthouse integration is configured separately.
* `npm run build` and `npm run build:development` use cached remote data for publications/photos.
* Netlify runs `npm run build:netlify`: it runs the test suite, then attempts to refresh remote data but can deploy using the committed photo cache if Cloudinary is unavailable or rate-limited. The build logs the reason and cached photo count. Photo changes appear after a successful refresh.
* Run `npm run build:refresh-data` for an explicit refresh of publication and photo data. This command stays strict: a failed Cloudinary request fails the build. Commit updated JSON caches after a successful local refresh so future deployments have a current fallback.
* Photo refreshes reuse embedded image metadata for unchanged asset versions; only new or replaced images require individual metadata requests. Tags and captions still refresh from the resource listing. Failed or empty refreshes do not replace the existing cache, and builds fail if neither remote data nor a usable photo cache is available.
* Run `node --test tests/getPhotos.test.js` to check photo refresh and fallback behavior without making external API requests.

### Publication metrics

* Google Scholar counts come from the public profile linked on the site and are saved in `src/contents/publications/scholar_metrics.json`. Papers are matched by their complete titles, ignoring case and punctuation. Ambiguous or unavailable records never become invented zero counts; a paper without a verified count links to Scholar instead.
* Remote-data builds make at most one Scholar profile request when the saved snapshot is older than 24 hours. A timeout, rate limit, or unexpected response keeps the saved counts and their original timestamps. Each count links to Scholar and shows its snapshot date in the tooltip. Normal local builds work entirely from the committed snapshot.
* To refresh the saved snapshot without refreshing photos/publications, run `FETCH_REMOTE_DATA=1 node -e 'require("./src/_data/publicationMetrics")()'`. The same 24-hour limit applies. Commit updated `scholar_metrics.json` so future deployments have that fallback; a deployment's temporary filesystem is not a durable cache.
* The official [Altmetric embed](https://docs.altmetric.com/badges/getting-started/) loads only on the publication page, after the page finishes loading. Its DOI-based donuts show online attention, not scholarly citation counts, and link to the paper's attention details. Metrics sit to the right on desktop and below each paper on narrow screens. The compact display omits provider text labels; citation links retain descriptive accessible names and snapshot-date tooltips.
