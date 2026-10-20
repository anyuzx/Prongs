const path = require("path");
const { generateSW } = require("workbox-build");

module.exports = async function generateServiceWorker(outputDir) {
  if (!outputDir) {
    return;
  }

  const swDest = path.join(outputDir, "service-worker.js");
  try {
    const { count, size, warnings } = await generateSW({
      globDirectory: outputDir,
      globPatterns: [
        "**/*.{html,css,js,json,svg,png,jpg,jpeg,webp,woff,woff2,ico,xml,txt}"
      ],
      // CJK fonts have many subsets. Cache only those actually requested by a page.
      globIgnores: [
        "assets/fonts/noto/**/*.woff2",
        "assets/fonts/noto/manifest.json",
        "assets/fonts/noto/LICENSE-*.txt",
        // Retired families are no longer referenced by the site's styles.
        "_includes/fonts/Inter-*",
        "_includes/fonts/overpass-*"
      ],
      runtimeCaching: [{
        urlPattern: ({ url, sameOrigin }) => sameOrigin &&
          url.pathname.startsWith("/assets/fonts/noto/") &&
          url.pathname.endsWith(".woff2"),
        handler: "CacheFirst",
        options: {
          cacheName: "noto-font-subsets",
          cacheableResponse: { statuses: [200] },
          expiration: { maxEntries: 256, maxAgeSeconds: 60 * 60 * 24 * 365 }
        }
      }],
      swDest,
      skipWaiting: true,
      clientsClaim: true,
      cleanupOutdatedCaches: true,
      sourcemap: false
    });

    for (const warning of warnings) {
      console.warn(`[service-worker] ${warning}`);
    }

    const sizeKb = Math.round(size / 1024);
    console.log(`[service-worker] Generated ${count} precached files (${sizeKb} KB).`);
  } catch (error) {
    console.error(`[service-worker] Failed to generate service worker: ${error.message}`);
  }
};
