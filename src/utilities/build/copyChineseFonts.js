const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Keep the full CJK fallback coverage in pinned dependencies, not in Git.
// The small common-character fonts are copied from src/assets/fonts by Eleventy.
const manifest = require("../../assets/fonts/noto/manifest.json");
const destination = path.resolve("dist/assets/fonts/noto");
fs.mkdirSync(destination, { recursive: true });

let count = 0;
for (const family of Object.values(manifest.families)) {
  const packageRoot = path.dirname(require.resolve(`${family.package}/package.json`));
  const installed = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8"));
  if (installed.version !== family.version) {
    throw new Error(`Font package version mismatch: ${family.package}`);
  }
  for (const font of family.files) {
    const bytes = fs.readFileSync(path.join(packageRoot, "files", font.source));
    const digest = crypto.createHash("sha256").update(bytes).digest("hex");
    if (digest !== font.sha256) {
      throw new Error(`Font checksum mismatch: ${font.source}`);
    }
    fs.writeFileSync(path.join(destination, font.file), bytes);
    count++;
  }
}
console.log(`[fonts] Copied ${count} CJK fallback subsets for on-demand loading.`);
