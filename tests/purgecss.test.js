const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const postcss = require('postcss');

test('production CSS retains typography and interactive states while removing unused rules', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'prongs-purgecss-'));
  try {
    const cssDir = path.join(fixture, 'dist/_includes/css');
    fs.mkdirSync(cssDir, { recursive: true });
    fs.writeFileSync(path.join(cssDir, 'main.css'), `
      :root { --ink: #161823; --unused: red; }
      @font-face { font-family: 'Source Sans 3'; src: url('/sans.woff2'); font-weight: 200 900; }
      :not(pre)>code { color: var(--ink); }
      .chinese-post .b-text { font-size: 1.0625rem; line-height: 1.8; }
      .chinese-post .b-text p { overflow-wrap: break-word; }
      .publication-tab[aria-selected="true"] { border-color: var(--ink); }
      .tabs-enhanced .publication-panel-heading { position: absolute; }
      .plus-minus[aria-expanded="true"]::before { transform: translate(-50%, -50%); }
      .table-of-contents li.active-toc::before { color: var(--ink); }
      :where(a, button, summary, [tabindex]):focus-visible { outline: 2px solid var(--ink); }
      [hidden] { display: none !important; }
      .unused-rule { color: red; }
    `);
    const html = `<html><head><style></style><style data-other>untouched</style></head><body>
      <article class="chinese-post"><section class="b-text"><p>中文</p></section></article>
      <a class="publication-tab">Publications</a><h2 class="publication-panel-heading">Papers</h2>
      <button class="plus-minus" aria-expanded="false">Expand</button>
      <ol class="table-of-contents"><li>Contents</li></ol>
      <script>container.classList.add("tabs-enhanced");tab.setAttribute("aria-selected", String(selected));
      toggle.setAttribute("aria-expanded", String(expanded));item.classList.add("active-toc");</script>
    </body></html>`;
    const transform = require.resolve('../src/utilities/transform/purgecss');
    const run = `require(${JSON.stringify(transform)})(${JSON.stringify(html)}, 'index.html').then(result => process.stdout.write(result));`;
    const output = execFileSync(process.execPath, ['-e', run], { cwd: fixture, encoding: 'utf8' });
    const inlineCSS = output.match(/<style>(.*?)<\/style>/s)[1];
    const parsed = postcss.parse(inlineCSS);
    const selectors = [];
    parsed.walkRules(rule => selectors.push(rule.selector));
    for (const selector of [
      ':not(pre)>code',
      '.chinese-post .b-text',
      '.chinese-post .b-text p',
      '.publication-tab[aria-selected="true"]',
      '.tabs-enhanced .publication-panel-heading',
      '.plus-minus[aria-expanded="true"]::before',
      '.table-of-contents li.active-toc::before',
      '[hidden]'
    ]) assert.ok(selectors.includes(selector), `Missing ${selector}`);
    assert.ok(selectors.some(selector => selector.endsWith(':focus-visible')));
    assert.ok(!selectors.includes('.unused-rule'));
    assert.match(inlineCSS, /@font-face/);
    assert.match(inlineCSS, /--ink:/);
    assert.doesNotMatch(inlineCSS, /--unused:/);
    assert.ok(output.endsWith(html.slice(html.indexOf('</head>'))));
    assert.match(output, /<style data-other>untouched<\/style>/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

test('non-HTML output is left untouched', async () => {
  const transform = require('../src/utilities/transform/purgecss');
  const content = '<style>placeholder</style>';
  assert.equal(await transform(content, 'feed.xml'), content);
});
