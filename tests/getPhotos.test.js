const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const sourcePath = path.join(__dirname, "../src/utilities/collections/getPhotos.js");
const source = fs.readFileSync(sourcePath, "utf8");

function photo(name, overrides = {}) {
  return {
    public_id: `guangshi.io/${name}`,
    asset_id: `asset-${name}`,
    version: 1,
    bytes: 1000,
    created_at: "2025-01-01T00:00:00Z",
    tags: ["original"],
    context: { custom: { caption: name } },
    image_metadata: { Model: "Test camera" },
    ...overrides
  };
}

function listing(item, overrides = {}) {
  const { image_metadata, ...resource } = item;
  return { ...resource, ...overrides };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function harness(options = {}) {
  const cached = options.cache === undefined ? [photo("cached")] : options.cache;
  const calls = { lists: [], details: [], writes: [], logs: [] };
  const mockFs = {
    async readFile() {
      if (options.readError) throw options.readError;
      return options.rawCache === undefined ? JSON.stringify(cached) : options.rawCache;
    },
    async mkdir() {},
    async writeFile(file, contents) {
      calls.writes.push({ file, photos: JSON.parse(contents) });
    }
  };
  const api = {
    async resources(query) {
      calls.lists.push(plain(query));
      if (!options.resources) throw new Error("Unexpected resource listing");
      return options.resources(query, calls.lists.length);
    },
    async resource(publicId, query) {
      calls.details.push({ publicId, query: plain(query) });
      if (!options.resource) throw new Error("Unexpected photo detail request");
      return options.resource(publicId, query);
    }
  };
  const module = { exports: {} };
  const log = (...args) => calls.logs.push(args.map(String).join(" "));
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    __dirname: path.dirname(sourcePath),
    process: { env: { FETCH_REMOTE_DATA: "1", REQUIRE_REMOTE_DATA: "0", ...options.env } },
    console: { log, warn: log, error: log },
    require(name) {
      if (name === "fs/promises") return mockFs;
      if (name === "path") return path;
      if (name === "cloudinary") return { v2: { api } };
      throw new Error(`Unexpected dependency: ${name}`);
    }
  }, { filename: sourcePath });
  return { getPhotos: module.exports, calls };
}

test("offline builds use the valid cache without API calls or writes", async () => {
  const cached = [photo("cached")];
  const h = harness({ cache: cached, env: { FETCH_REMOTE_DATA: "0" } });
  assert.deepEqual(plain(await h.getPhotos()), cached);
  assert.equal(h.calls.lists.length, 0);
  assert.equal(h.calls.details.length, 0);
  assert.equal(h.calls.writes.length, 0);
});

test("best-effort listing failure preserves the cached gallery", async () => {
  const cached = [photo("first"), photo("second")];
  const h = harness({
    cache: cached,
    resources: async () => { throw { error: { message: "Rate limit reached", http_code: 420 } }; }
  });
  assert.deepEqual(plain(await h.getPhotos()), cached);
  assert.equal(h.calls.details.length, 0);
  assert.equal(h.calls.writes.length, 0);
  assert.match(h.calls.logs.join("\n"), /Rate limit reached/);
});

test("empty remote galleries never replace the cache, and strict refresh rejects them", async t => {
  const cached = [photo("cached")];
  const listings = [
    ["empty listing", []],
    ["zero-byte placeholder", [listing(photo("placeholder", { bytes: 0 }))]]
  ];
  for (const [name, resources] of listings) {
    for (const strict of [false, true]) {
      await t.test(`${name}, ${strict ? "strict" : "best-effort"}`, async () => {
        const h = harness({
          cache: cached,
          env: { REQUIRE_REMOTE_DATA: strict ? "1" : "0" },
          resources: async () => ({ resources })
        });
        if (strict) {
          await assert.rejects(h.getPhotos(), error => /empty|no photos/i.test(error.message));
        } else {
          assert.deepEqual(plain(await h.getPhotos()), cached);
        }
        assert.equal(h.calls.details.length, 0);
        assert.equal(h.calls.writes.length, 0);
      });
    }
  }
});

test("detail failure falls back to the complete cache without saving partial results", async () => {
  const cached = [photo("cached")];
  const added = photo("added");
  const failed = photo("failed");
  const h = harness({
    cache: cached,
    resources: async () => ({ resources: [listing(cached[0]), listing(added), listing(failed)] }),
    resource: async publicId => {
      if (publicId === failed.public_id) throw { error: { message: "Service unavailable", http_code: 503 } };
      return added;
    }
  });
  assert.deepEqual(plain(await h.getPhotos()), cached);
  assert.equal(h.calls.writes.length, 0);
});

test("strict refresh reports the nested Cloudinary message and HTTP status", async () => {
  const sensitiveValue = "do-not-log-request-options";
  const h = harness({
    env: { REQUIRE_REMOTE_DATA: "1" },
    resources: async () => {
      throw {
        error: { message: "Rate limit reached", http_code: 420 },
        request_options: { auth: sensitiveValue }
      };
    }
  });
  await assert.rejects(h.getPhotos(), error => {
    assert.match(error.message, /Rate limit reached/);
    assert.match(error.message, /420/);
    assert.ok(!error.message.includes(sensitiveValue));
    return true;
  });
  assert.ok(!h.calls.logs.join("\n").includes(sensitiveValue));
  assert.equal(h.calls.writes.length, 0);
});

test("remote failure cannot silently publish an empty gallery without a usable cache", async t => {
  const cases = [
    ["missing", { readError: Object.assign(new Error("Missing cache"), { code: "ENOENT" }) }],
    ["malformed", { rawCache: "{broken-json" }],
    ["non-array", { rawCache: "{}" }],
    ["empty", { cache: [] }]
  ];
  for (const [name, cacheOptions] of cases) {
    await t.test(name, async () => {
      const h = harness({
        ...cacheOptions,
        resources: async () => { throw new Error("Connection reset"); }
      });
      await assert.rejects(h.getPhotos(), error => /Connection reset/.test(error.message));
      assert.equal(h.calls.writes.length, 0);
    });
  }
});

test("unchanged assets reuse metadata while fresh listing tags and context replace cached values", async () => {
  const edited = photo("edited");
  const cleared = photo("cleared");
  const editedListing = listing(edited, { tags: ["new-tag"], context: { custom: { caption: "New caption" } } });
  const clearedListing = listing(cleared);
  delete clearedListing.tags;
  delete clearedListing.context;
  const h = harness({
    cache: [edited, cleared],
    resources: async () => ({ resources: [editedListing, clearedListing] })
  });
  const result = plain(await h.getPhotos());
  assert.equal(h.calls.details.length, 0);
  assert.deepEqual(result[0].image_metadata, edited.image_metadata);
  assert.deepEqual(result[0].tags, ["new-tag"]);
  assert.deepEqual(result[0].context, { custom: { caption: "New caption" } });
  assert.deepEqual(result[1].image_metadata, cleared.image_metadata);
  assert.deepEqual(result[1].tags, []);
  assert.deepEqual(result[1].context, {});
  assert.equal(h.calls.writes.length, 1);
  assert.deepEqual(h.calls.writes[0].photos, result);
});

test("new or changed assets and incomplete cached metadata trigger detail refresh", async () => {
  const replaced = photo("replaced");
  const changed = photo("changed");
  const noAssetId = photo("no-asset", { asset_id: "" });
  const noVersion = photo("no-version", { version: undefined });
  const noMetadata = photo("no-metadata", { image_metadata: undefined });
  const nullMetadata = photo("null-metadata", { image_metadata: null });
  const newPhoto = photo("new");
  const resources = [
    listing(replaced, { asset_id: "replacement-asset" }),
    listing(changed, { version: 2 }),
    listing(noAssetId),
    listing(noVersion),
    listing(noMetadata),
    listing(nullMetadata),
    listing(newPhoto)
  ];
  const h = harness({
    cache: [replaced, changed, noAssetId, noVersion, noMetadata, nullMetadata],
    resources: async () => ({ resources }),
    resource: async publicId => ({
      ...resources.find(item => item.public_id === publicId),
      image_metadata: { Model: "Refreshed camera" }
    })
  });
  const result = plain(await h.getPhotos());
  assert.deepEqual(h.calls.details.map(call => call.publicId).sort(), resources.map(item => item.public_id).sort());
  assert.ok(h.calls.details.every(call => call.query.image_metadata === true));
  assert.ok(result.every(item => item.image_metadata.Model === "Refreshed camera"));
  assert.equal(h.calls.writes.length, 1);
});

test("pagination collects every page and publishes valid photos in creation order", async () => {
  const older = photo("older", { created_at: "2024-01-01T00:00:00Z" });
  const newer = photo("newer", { created_at: "2025-01-01T00:00:00Z" });
  const empty = photo("empty", { bytes: 0 });
  const details = new Map([older, newer].map(item => [item.public_id, item]));
  const h = harness({
    cache: [],
    resources: async (query, page) => page === 1
      ? { resources: [listing(newer)], next_cursor: "second-page" }
      : { resources: [listing(older), listing(empty)] },
    resource: async publicId => details.get(publicId)
  });
  const result = plain(await h.getPhotos());
  assert.equal(h.calls.lists.length, 2);
  assert.equal(h.calls.lists[1].next_cursor, "second-page");
  assert.ok(h.calls.lists.every(query => query.prefix === "guangshi.io"));
  assert.deepEqual(result.map(item => item.public_id), [older.public_id, newer.public_id]);
  assert.equal(h.calls.details.length, 2);
  assert.equal(h.calls.writes.length, 1);
  assert.deepEqual(h.calls.writes[0].photos, result);
});

test("cache replacement waits until all photo details have succeeded", async () => {
  const first = photo("first");
  const last = photo("last");
  let resolveLast;
  let lastRequested;
  const lastStarted = new Promise(resolve => { lastRequested = resolve; });
  const lastDetail = new Promise(resolve => { resolveLast = resolve; });
  const h = harness({
    cache: [],
    resources: async () => ({ resources: [listing(first), listing(last)] }),
    resource: async publicId => {
      if (publicId === last.public_id) {
        lastRequested();
        return lastDetail;
      }
      return first;
    }
  });
  const pending = h.getPhotos();
  await lastStarted;
  assert.equal(h.calls.writes.length, 0);
  resolveLast(last);
  const result = plain(await pending);
  assert.equal(h.calls.writes.length, 1);
  assert.deepEqual(h.calls.writes[0].photos, result);
});
