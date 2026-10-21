const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const test = require('node:test');

// Resolve from each consumer so an old nested dependency cannot pass unnoticed.
for (const consumer of ['mocha', '@rollup/plugin-terser', 'terser-webpack-plugin']) {
  test(`${consumer}: serializer rejects unsafe Date output and quotes RegExp flags`, () => {
    const fromConsumer = createRequire(require.resolve(consumer));
    const serialize = fromConsumer('serialize-javascript');

    const pattern = /fixture/g;
    Object.defineProperty(pattern, 'flags', { value: 'g";__SERIALIZER_SENTINEL__;//' });
    // Inspect the output only: never evaluate serialized hostile strings.
    assert.equal(serialize({ pattern }), '{"pattern":new RegExp("fixture", "g")}');

    const date = new Date('2026-01-01T00:00:00.000Z');
    date.toJSON = () => 'placeholder';
    date.toISOString = () => '";__DATE_SENTINEL__;//';
    assert.throws(() => serialize({ date }), /Invalid Date ISO string/);

    // A filter trap detects the old array-like iteration without a CPU-heavy loop.
    const arrayLike = Object.create(Array.prototype);
    Object.defineProperty(arrayLike, 'length', { value: 1000000000, enumerable: true });
    Object.defineProperty(arrayLike, 'filter', {
      value() { throw new Error('Array-like objects must not be iterated as arrays'); }
    });
    assert.equal(serialize(arrayLike), '{"length":1000000000}');

    assert.equal(serialize({ pattern: /(^_|_$)/ }), '{"pattern":new RegExp("(^_|_$)", "")}');
  });
}

for (const consumer of ['cloudinary', 'jshint', 'typography', 'group-args', 'critical']) {
  test(`${consumer}: Lodash rejects non-identifier template import names`, () => {
    const fromConsumer = createRequire(require.resolve(consumer));
    const template = fromConsumer('lodash/template');

    // The default parameter is a harmless literal; the patched API must reject it.
    assert.throws(
      () => template('fixture', { imports: { 'value = 1': undefined } }),
      /Invalid.*imports/
    );
    const render = template('Hello <%= format(name) %>', {
      imports: { format: value => value.toUpperCase() }
    });
    assert.equal(render({ name: 'Guang' }), 'Hello GUANG');
  });
}
