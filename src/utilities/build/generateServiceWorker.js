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
