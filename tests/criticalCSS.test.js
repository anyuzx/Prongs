const assert = require("node:assert/strict");
const test = require("node:test");
const { runWorkerPool } = require("../criticalCSS");

test("critical CSS keeps output paths and bounds concurrent browser jobs", async () => {
  const sources = ["dist/index.html", "dist/posts/a.html", "dist/posts/b.html"];
  const css = ["dist/_includes/css/main.css"];
  const calls = [];
  let active = 0;
  let peak = 0;

  const results = await runWorkerPool(sources, css, 2, async options => {
    calls.push(options);
    peak = Math.max(peak, ++active);
    await new Promise(resolve => setImmediate(resolve));
    active--;
  });

  assert.equal(peak, 2);
  assert.deepEqual(results, sources.map(source => ({ source, success: true })));
  assert.deepEqual(calls, sources.map(src => ({ css, inline: true, src, target: { html: src } })));
});

test("critical CSS records failures and still processes the remaining pages", async () => {
  const failure = new Error("browser could not load this page");
  const sources = ["dist/a.html", "dist/b.html", "dist/c.html"];
  const visited = [];
  const results = await runWorkerPool(sources, [], 1, async ({ src }) => {
    visited.push(src);
    if (src === sources[1]) throw failure;
  });

  assert.deepEqual(visited, sources);
  assert.deepEqual(results, [
    { source: sources[0], success: true },
    { source: sources[1], success: false, error: failure },
    { source: sources[2], success: true }
  ]);
});
