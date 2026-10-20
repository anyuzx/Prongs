const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../src/_includes/js/loadServiceWorker.js"), "utf8");

function run(readyState, register) {
  const listeners = [];
  const warnings = [];
  vm.runInNewContext(source, {
    navigator: register ? { serviceWorker: { register } } : {},
    document: { readyState },
    window: { addEventListener: (...args) => listeners.push(args) },
    console: { warn: (...args) => warnings.push(args) }
  });
  return { listeners, warnings };
}

test("waits for page load and registers once without changing the worker URL", async () => {
  const urls = [];
  const { listeners } = run("loading", async (url) => urls.push(url));
  assert.equal(urls.length, 0);
  assert.equal(listeners.length, 1);
  assert.equal(listeners[0][0], "load");
  assert.equal(listeners[0][2].once, true);
  await listeners[0][1]();
  assert.deepEqual(urls, ["/service-worker.js"]);
});

test("registers when load already happened and catches registration failures", async () => {
  const error = new Error("Unavailable");
  const result = run("complete", async () => { throw error; });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(result.listeners.length, 0);
  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0][1], error);
});

test("does nothing when service workers are unsupported", () => {
  assert.equal(run("loading").listeners.length, 0);
});
