const fs = require("fs");
const path = require("path");
const { parseDocument } = require("htmlparser2");
const postcss = require("postcss");

const FONT_URL = "/assets/fonts/noto/fonts.css";
const FONT_PATH = path.resolve(__dirname, "../../assets/fonts/noto/fonts.css");
const PLACEHOLDER = "<!-- chinese-fonts -->";

function parseRanges(value) {
  return value.split(",").map(part => {
    const match = /^U\+([\dA-F?]{1,6})(?:-([\dA-F]{1,6}))?$/i.exec(part.trim());
    if (!match || (match[2] && match[1].includes("?"))) {
      throw new Error(`Invalid font unicode-range: ${part}`);
    }
    const low = parseInt(match[1].replace(/\?/g, "0"), 16);
    const high = parseInt(match[2] || match[1].replace(/\?/g, "F"), 16);
    if (low > high || high > 0x10FFFF) {
      throw new Error(`Invalid font unicode-range: ${part}`);
    }
    return [low, high];
  });
}

function absoluteFontUrls(value) {
  return value.replace(/url\(\s*(?:(["'])(.*?)\1|([^\s"')]+))\s*\)/gi,
    (original, quote, quoted, unquoted) => {
      const url = quoted || unquoted;
      if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(url)) return original;
      return `url("${path.posix.join(path.posix.dirname(FONT_URL), url)}")`;
    });
}

function fontFaces(css) {
  const faces = [];
  postcss.parse(css).walkAtRules("font-face", rule => {
    let unicodeRange;
    const copy = rule.clone();
    copy.walkDecls(decl => {
      if (decl.prop === "unicode-range") unicodeRange = decl.value;
      if (decl.prop === "src") decl.value = absoluteFontUrls(decl.value);
    });
    faces.push({
      rule: copy,
      ranges: unicodeRange ? parseRanges(unicodeRange) : [[0, 0x10FFFF]]
    });
  });
  return faces;
}

function textCodepoints(html) {
  // htmlparser2 is supplied by the existing PostHTML parser dependency. Its DOM
  // distinguishes comments from entity-decoded text without rewriting the page.
  const document = parseDocument(html, { decodeEntities: true });
  const points = new Set();
  function bodyOf(nodes) {
    for (const node of nodes) {
      if (node.name === "body") return node;
      const body = node.children && bodyOf(node.children);
      if (body) return body;
    }
  }
  function collect(nodes) {
    for (const node of nodes) {
      if (["head", "script", "style"].includes(node.name)) continue;
      const attrs = node.attribs || {};
      const visibleAttributes = node.name === "img" ? [attrs.alt]
        : node.name === "input" && (attrs.type || "").toLowerCase() !== "hidden"
          ? [attrs.value, attrs.placeholder]
          : node.name === "textarea" ? [attrs.placeholder] : [];
      for (const text of visibleAttributes) {
        for (const character of text || "") points.add(character.codePointAt(0));
      }
      if (node.type === "text") {
        for (const character of node.data) points.add(character.codePointAt(0));
      } else if (node.children) {
        // Include hidden excerpts and template text which can be revealed later.
        collect(node.children);
      }
    }
  }
  const body = bodyOf(document.children);
  collect(body ? body.children : document.children);
  return [...points].sort((a, b) => a - b);
}

function intersects(points, [low, high]) {
  // Find the first page character at or above this range's lower bound.
  let start = 0;
  let end = points.length;
  while (start < end) {
    const middle = (start + end) >>> 1;
    if (points[middle] < low) start = middle + 1;
    else end = middle;
  }
  return start < points.length && points[start] <= high;
}

function pageFontRule(face, points) {
  const matched = points.filter(point =>
    face.ranges.some(([low, high]) => point >= low && point <= high));
  const ranges = [];
  for (const point of matched) {
    if (ranges.length && ranges[ranges.length - 1][1] + 1 === point) {
      ranges[ranges.length - 1][1] = point;
    } else {
      ranges.push([point, point]);
    }
  }
  const value = ranges.map(([low, high]) =>
    `U+${low.toString(16).toUpperCase()}${low === high ? "" : `-${high.toString(16).toUpperCase()}`}`
  ).join(",");
  const rule = face.rule.clone();
  let hasRange = false;
  rule.walkDecls("unicode-range", declaration => {
    declaration.value = value;
    hasRange = true;
  });
  if (!hasRange) rule.append({ prop: "unicode-range", value });
  return rule.toString();
}

function stylesheetSlot(html) {
  if (html.includes(PLACEHOLDER)) return PLACEHOLDER;
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const link = parseDocument(match[0], { decodeEntities: true }).children[0];
    const attrs = link && link.attribs;
    if (attrs && attrs.href === FONT_URL &&
        (attrs.rel || "").toLowerCase().split(/\s+/).includes("stylesheet")) {
      return match[0];
    }
  }
  return null;
}

function createTransform(loadCss) {
  let previousCss;
  let faces;
  return function inlineChineseFonts(html, outputPath) {
    if (!outputPath || !outputPath.endsWith(".html")) return html;
    const slot = stylesheetSlot(html);
    if (!slot) return html;
    const css = loadCss();
    if (css !== previousCss) {
      faces = fontFaces(css);
      previousCss = css;
    }
    const points = textCodepoints(html);
    const selected = faces.filter(face => face.ranges.some(range => intersects(points, range)));
    const replacement = selected.length
      ? `<style data-noto-fonts>${selected.map(face => pageFontRule(face, points)).join("\n")}</style>`
      : "";
    return html.replace(slot, replacement);
  };
}

let cachedVersion;
let cachedCss;
module.exports = createTransform(() => {
  // Watch builds see regenerated subsets without rereading/parsing CSS per page.
  const stat = fs.statSync(FONT_PATH);
  const version = `${stat.mtimeMs}:${stat.size}`;
  if (version !== cachedVersion) {
    cachedCss = fs.readFileSync(FONT_PATH, "utf8");
    cachedVersion = version;
  }
  return cachedCss;
});
module.exports.createTransform = createTransform;
