const critical = require("critical");
const fg = require("fast-glob");

const DEFAULT_HTML_GLOB = "dist/**/*.html";
const DEFAULT_CSS_FILES = [
  "dist/_includes/css/main.css",
  "dist/_includes/css/atelier-forest-light.css"
];
const DEFAULT_CONCURRENCY = 5;

function readConcurrency() {
  const parsed = Number.parseInt(process.env.CRITICAL_CONCURRENCY || "", 10);
  if (Number.isNaN(parsed) || parsed < 1) {
    return DEFAULT_CONCURRENCY;
  }
  return parsed;
}

function readCssFiles() {
  const fromEnv = process.env.CRITICAL_CSS_FILES;
  if (!fromEnv) {
    return DEFAULT_CSS_FILES;
  }

  const cssFiles = fromEnv
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  return cssFiles.length > 0 ? cssFiles : DEFAULT_CSS_FILES;
}

async function collectHtmlSources() {
  const htmlGlob = process.env.CRITICAL_HTML_GLOB || DEFAULT_HTML_GLOB;
  return fg(htmlGlob, { onlyFiles: true });
}

async function processOneFile(source, cssFiles) {
  try {
    await critical.generate({
      css: cssFiles,
      inline: true,
      src: source,
      target: { html: source }
    });
    console.log(`[ok] inlined critical CSS for ${source}`);
    return { source, success: true };
  } catch (error) {
    console.error(`[error] failed to inline critical CSS for ${source}`);
    console.error(error);
    return { source, success: false, error };
  }
}

async function runWorkerPool(sources, cssFiles, workerCount) {
  const results = new Array(sources.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor;
      cursor += 1;
      if (idx >= sources.length) {
        return;
      }
      results[idx] = await processOneFile(sources[idx], cssFiles);
    }
  }

  const poolSize = Math.min(workerCount, sources.length);
  await Promise.all(Array.from({ length: poolSize }, () => worker()));
  return results;
}

async function main() {
  const cssFiles = readCssFiles();
  const concurrency = readConcurrency();
  const sources = await collectHtmlSources();

  if (sources.length === 0) {
    console.log("[info] no HTML files found; nothing to process.");
    return;
  }

  console.log(`[info] found ${sources.length} HTML files`);
  console.log(`[info] using concurrency=${concurrency}`);

  const results = await runWorkerPool(sources, cssFiles, concurrency);
  const failed = results.filter((x) => x && !x.success).length;

  if (failed > 0) {
    console.error(`[done] completed with ${failed} failures`);
    process.exitCode = 1;
    return;
  }

  console.log("[done] all files processed successfully");
}

main().catch((error) => {
  console.error("[fatal] critical CSS generation failed");
  console.error(error);
  process.exitCode = 1;
});
