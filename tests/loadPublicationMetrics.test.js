const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '../src/_includes/js/loadPublicationMetrics.js'), 'utf8');

function run({ readyState = 'loading', hasBadge = true } = {}) {
  const scripts = [];
  const events = [];
  const initializations = [];
  const publications = { id: 'publications' };
  vm.runInNewContext(source, {
    document: {
      readyState,
      querySelector: () => hasBadge ? {} : null,
      getElementById: id => id === 'publications' ? publications : null,
      createElement: tag => { assert.equal(tag, 'script'); return {}; },
      head: { appendChild: script => scripts.push(script) }
    },
    window: {
      addEventListener: (type, callback, options) => events.push({ type, callback, options }),
      _altmetric_embed_init: context => initializations.push(context)
    }
  });
  return { scripts, events, initializations, publications };
}

test('Altmetric loads asynchronously after page resources, only where badges exist', () => {
  const { scripts, events, initializations, publications } = run();
  assert.equal(scripts.length, 0);
  assert.equal(events.length, 1);
  assert.equal(events[0].type, 'load');
  assert.equal(events[0].options.once, true);
  events[0].callback();
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, 'https://embed.altmetric.com/assets/embed.js');
  assert.equal(scripts[0].async, true);
  assert.equal(initializations.length, 0);
  scripts[0].onload();
  assert.deepEqual(initializations, [publications]);

  const absent = run({ hasBadge: false });
  assert.equal(absent.events.length, 0);
  assert.equal(absent.scripts.length, 0);
});

test('Altmetric also loads when the page has already finished loading', () => {
  const { scripts, events } = run({ readyState: 'complete' });
  assert.equal(events.length, 0);
  assert.equal(scripts.length, 1);
});
