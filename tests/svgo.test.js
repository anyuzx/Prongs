const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const optimizeSvg = require("../src/utilities/filters/svgo");

function render(svg) {
  return new Promise((resolve, reject) => {
    optimizeSvg(svg, (error, result) => error ? reject(error) : resolve(result));
  });
}

test("SVG filter preserves scalable inline icons with SVGO's current API", async () => {
  const directory = path.join(__dirname, "../src/_includes/svg");
  for (const name of fs.readdirSync(directory).filter(name => name.endsWith(".svg"))) {
    const source = fs.readFileSync(path.join(directory, name), "utf8");
    const optimized = await render(source);
    const root = optimized.match(/<svg\b[^>]*>/)?.[0];
    assert.ok(root, `${name}: contains an SVG root`);
    assert.match(root, /\bviewBox="[^"]+"/, `${name}: retains an intrinsic coordinate system`);
    assert.doesNotMatch(root, /\s(?:width|height|xmlns)=/, `${name}: uses CSS dimensions inline`);
  }
});

test("SVG filter reports malformed SVG through the Nunjucks callback", async () => {
  await assert.rejects(render("<svg><path></svg>"));
});
