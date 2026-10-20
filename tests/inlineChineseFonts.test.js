const assert = require("node:assert/strict");
const test = require("node:test");
const { createTransform } = require("../src/utilities/transform/inlineChineseFonts");

const css = `
@font-face { font-family: 'Noto Sans SC'; font-weight: 100 900;
  font-style: normal; font-display: swap; src: url('./name.woff2') format('woff2');
  unicode-range: U+5149,U+65F6; }
@font-face { font-family: 'Noto Serif SC'; font-weight: 200 900;
  src: url(./serif.woff2) format('woff2'); unicode-range: U+5149; }
@font-face { font-family: 'Noto Sans SC'; font-weight: 100 900;
  src: url('./other.woff2') format('woff2'); unicode-range: U+4E00-4E09; }
@font-face { font-family: 'Noto Sans SC'; font-weight: 100 900;
  src: url('./supplementary.woff2') format('woff2'); unicode-range: U+200??; }
`;

const link = '<link rel="stylesheet" href="/assets/fonts/noto/fonts.css">';
const page = body => `<!doctype html><html><head>${link}</head><body>${body}</body></html>`;

test("English pages omit the font stylesheet and all unused font faces", () => {
  const transform = createTransform(() => css);
  const result = transform(page('<p>Hello <em>world</em>.</p>'), "index.html");
  assert.doesNotMatch(result, /fonts\.css|@font-face|data-noto-fonts/);
  assert.match(result, /Hello <em>world<\/em>/);
});

test("decodes entities, retains matching families and weights, and makes URLs absolute", () => {
  const transform = createTransform(() => css);
  const result = transform(page('<h1>&#x65F6;&#20809;</h1>'), "index.html");
  assert.match(result, /url\("\/assets\/fonts\/noto\/name\.woff2"\)/);
  assert.match(result, /url\("\/assets\/fonts\/noto\/serif\.woff2"\)/);
  assert.match(result, /font-weight: 100 900/);
  assert.match(result, /font-weight: 200 900/);
  assert.doesNotMatch(result, /other\.woff2|supplementary\.woff2|<link/);
  assert.match(result, /&#x65F6;&#20809;/); // The original content is untouched.
});

test("ignores metadata, attributes, comments, scripts, and styles", () => {
  const transform = createTransform(() => css);
  const html = `<html><head>${link}<title>时光</title></head><body>
    <p title="时光">English</p><!-- 时光 -->
    <script>const hidden = "时光";</script><style>.x:before { content: "时光"; }</style>
    </body></html>`;
  assert.doesNotMatch(transform(html, "index.html"), /@font-face|data-noto-fonts/);
});

test("keeps hidden excerpts and literal escaped comment text", () => {
  const transform = createTransform(() => css);
  assert.match(transform(page('<div hidden>时</div>'), "index.html"), /name\.woff2/);
  assert.match(transform(page('<code>&lt;!-- 光 --&gt;</code>'), "index.html"), /serif\.woff2/);
});

test("matches supplementary Unicode characters and wildcard ranges", () => {
  const transform = createTransform(() => css);
  const result = transform(page('<p>&#x20000;</p>'), "index.html");
  assert.match(result, /supplementary\.woff2/);
  assert.doesNotMatch(result, /name\.woff2|serif\.woff2|other\.woff2/);
});

test("handles alternate link attribute order, placeholders, and non-HTML output", () => {
  const transform = createTransform(() => css);
  const reordered = page("时").replace(link,
    "<LINK href='/assets/fonts/noto/fonts.css' rel='stylesheet'>");
  assert.match(transform(reordered, "index.html"), /name\.woff2/);
  const placeholder = page("光").replace(link, "<!-- chinese-fonts -->");
  assert.match(transform(placeholder, "index.html"), /name\.woff2/);
  assert.equal(transform(placeholder, "feed.xml"), placeholder);
});

test("refreshes parsed faces when a watch build regenerates the CSS", () => {
  let source = css;
  const transform = createTransform(() => source);
  assert.match(transform(page("时"), "index.html"), /name\.woff2/);
  source = css.replace("name.woff2", "name-new.woff2");
  assert.match(transform(page("时"), "index.html"), /name-new\.woff2/);
});

test("emits only this page's codepoints and compacts consecutive ranges", () => {
  const transform = createTransform(() => css);
  const result = transform(page("时一丁"), "index.html");
  assert.match(result, /unicode-range: U\+65F6;/);
  assert.match(result, /unicode-range: U\+4E00-4E01;/);
  assert.doesNotMatch(result, /U\+5149|U\+4E00-4E09/);
  // A subsequent build/page still has access to the complete source ranges.
  assert.match(transform(page("三"), "other.html"), /unicode-range: U\+4E09;/);
});

test("includes image alternatives and visible input/textarea text", () => {
  const transform = createTransform(() => css);
  for (const markup of [
    '<img alt="&#x65F6;">', '<input value="时">',
    '<input placeholder="时">', '<textarea placeholder="时"></textarea>'
  ]) {
    assert.match(transform(page(markup), "index.html"), /name\.woff2/);
  }
  assert.doesNotMatch(transform(page('<input type="hidden" value="时">'), "index.html"), /@font-face/);
});
