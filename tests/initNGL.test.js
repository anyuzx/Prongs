const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "../src/_includes/js/initNGL.js"), "utf8");
const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

function viewer({ readyState = "complete", library = true, renderer = true, constructorError = false } = {}) {
  const elements = {
    NGLviewport: { dataset: {}, style: { visibility: "hidden" } },
    NGLfallback: { hidden: false },
    NGLimageCredit: { hidden: false },
    NGLstatus: { textContent: "" }
  };
  const calls = { stages: [], loads: [], representations: [], autoViews: 0, resizes: 0, disposals: 0 };
  const documentListeners = [];
  const windowListeners = [];
  const timers = new Map();
  let nextTimer = 0;
  let resolveLoad;
  let rejectLoad;
  const pendingLoad = new Promise((resolve, reject) => {
    resolveLoad = resolve;
    rejectLoad = reject;
  });
  const component = {
    addRepresentation: (...args) => calls.representations.push(args)
  };
  const stage = {
    viewer: { renderer: renderer ? {} : undefined },
    loadFile: (...args) => {
      calls.loads.push(args);
      return pendingLoad;
    },
    autoView: () => { calls.autoViews += 1; },
    handleResize: () => { calls.resizes += 1; },
    dispose: () => { calls.disposals += 1; }
  };
  const document = {
    readyState,
    getElementById: (id) => elements[id],
    addEventListener: (...args) => documentListeners.push(args)
  };
  const window = {
    addEventListener: (...args) => windowListeners.push(args),
    setTimeout: (callback, delay) => {
      const id = ++nextTimer;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id)
  };
  if (library) {
    window.NGL = {
      Stage: function (...args) {
        calls.stages.push(args);
        if (constructorError) throw new Error("WebGL initialization failed");
        return stage;
      }
    };
  }
  const context = vm.createContext({ document, window });
  return {
    elements, calls, timers, documentListeners, windowListeners,
    run: () => vm.runInContext(source, context),
    ready: () => {
      document.readyState = "interactive";
      for (const [event, callback] of documentListeners.splice(0)) {
        assert.equal(event, "DOMContentLoaded");
        callback();
      }
    },
    resolve: () => resolveLoad(component),
    reject: () => rejectLoad(new Error("Structure download failed"))
  };
}

function assertFallback(env) {
  assert.equal(env.elements.NGLviewport.style.visibility, "hidden");
  assert.equal(env.elements.NGLfallback.hidden, false);
  assert.equal(env.elements.NGLimageCredit.hidden, false);
  assert.match(env.elements.NGLstatus.textContent, /static view of PDB 6CO8/);
  assert.equal(env.windowListeners.length, 0);
  assert.equal(env.timers.size, 0);
}

test("waits for the DOM, initializes once, and loads the biological assembly as a white cartoon viewer", async () => {
  const env = viewer({ readyState: "loading" });
  env.run();
  env.run(); // Duplicate script tags must not create competing WebGL canvases.
  assert.equal(env.calls.stages.length, 0);
  assert.ok(env.documentListeners.every(([, , options]) => options.once === true));
  env.ready();
  assert.equal(env.calls.stages.length, 1);
  assert.equal(env.calls.stages[0][0], env.elements.NGLviewport);
  assert.equal(env.calls.stages[0][1].backgroundColor, "white");
  assert.equal(env.calls.loads.length, 1);
  assert.equal(env.calls.loads[0][0], "https://files.rcsb.org/download/6CO8.cif");
  assert.equal(env.calls.loads[0][1].defaultAssembly, "BU1");
  assert.equal(env.elements.NGLfallback.hidden, false);
  env.resolve();
  await flushPromises();
  assert.equal(env.calls.representations.length, 1);
  assert.equal(env.calls.representations[0][0], "cartoon");
  assert.equal(env.calls.representations[0][1].sele, "polymer");
  assert.equal(env.calls.autoViews, 1);
  assert.equal(env.elements.NGLviewport.style.visibility, "visible");
  assert.equal(env.elements.NGLfallback.hidden, true);
  assert.equal(env.elements.NGLimageCredit.hidden, true);
  assert.match(env.elements.NGLstatus.textContent, /Drag to rotate/);
  assert.equal(env.timers.size, 0);
  assert.equal(env.windowListeners.length, 1);
  assert.equal(env.windowListeners[0][0], "resize");
  env.windowListeners[0][1]();
  assert.equal(env.calls.resizes, 1);
  env.run();
  assert.equal(env.calls.stages.length, 1);
  assert.equal(env.calls.disposals, 0);
});

test("keeps the static structure when the library or WebGL is unavailable", () => {
  for (const options of [{ library: false }, { renderer: false }, { constructorError: true }]) {
    const env = viewer(options);
    env.run();
    assertFallback(env);
    assert.equal(env.calls.loads.length, 0);
    // A partial NGL Stage has no controls to dispose and must not be disposed.
    assert.equal(env.calls.disposals, 0);
  }
});

test("returns to the static structure and releases the renderer when the download fails", async () => {
  const env = viewer();
  env.run();
  env.reject();
  await flushPromises();
  assertFallback(env);
  assert.match(env.elements.NGLstatus.textContent, /could not be loaded/);
  assert.equal(env.calls.disposals, 1);
  assert.equal(env.calls.representations.length, 0);
});

test("times out without allowing a late download to reveal a disposed, blank viewer", async () => {
  const env = viewer();
  env.run();
  assert.equal(env.timers.size, 1);
  const timer = [...env.timers.values()][0];
  assert.equal(timer.delay, 30000);
  timer.callback();
  assertFallback(env);
  assert.match(env.elements.NGLstatus.textContent, /took too long/);
  const message = env.elements.NGLstatus.textContent;
  env.resolve();
  await flushPromises();
  assertFallback(env);
  assert.equal(env.elements.NGLstatus.textContent, message);
  assert.equal(env.calls.disposals, 1);
  assert.equal(env.calls.representations.length, 0);
  assert.equal(env.calls.autoViews, 0);
});
