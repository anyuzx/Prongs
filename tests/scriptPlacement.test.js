const assert = require('node:assert/strict');
const test = require('node:test');
const path = require('node:path');
const nunjucks = require('nunjucks');
const { parseDocument, DomUtils } = require('htmlparser2');

test('head-only inline scripts are not repeated in the footer', () => {
  const env = new nunjucks.Environment(new nunjucks.FileSystemLoader(
    path.join(__dirname, '../src/_includes')
  ));
  env.addFilter('jsmin', value => value);
  const html = env.render('layouts/base.njk', {
    site: { ENV: 'development', FEED: {} },
    page: { url: '/photos/' },
    script: [
      { src: 'js/lazyLoading.js', inline: true, head: true },
      { src: 'js/initNGL.js', inline: true },
      { src: 'https://cdn.jsdelivr.net/npm/ngl@2.5.0/dist/ngl.js', link: true, head: true, defer: true }
    ]
  });
  const dom = parseDocument(html);
  const nodes = name => DomUtils.findAll(node => node.name === name, dom.children);
  const head = nodes('head')[0];
  const body = nodes('body')[0];
  const scripts = root => DomUtils.findAll(node => node.name === 'script', root.children);
  const content = script => DomUtils.textContent(script);
  assert.equal(scripts(head).filter(script => content(script).includes('window.lazyLoadOptions')).length, 1);
  assert.equal(scripts(body).filter(script => content(script).includes('window.lazyLoadOptions')).length, 0);
  assert.equal(scripts(head).filter(script => content(script).includes('NGLviewport')).length, 0);
  assert.equal(scripts(body).filter(script => content(script).includes('NGLviewport')).length, 1);
  const library = scripts(head).filter(script => script.attribs.src?.includes('/ngl@'));
  assert.equal(library.length, 1);
  assert.ok(Object.hasOwn(library[0].attribs, 'defer'));
});
