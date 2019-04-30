import test from "tape";

import {
  newUrlPatternParser,
  getParam,
  astNodeToRegexString,
  astNodeToNames
}  from "../dist/parser.js";

import {
  defaultOptions,
} from "../dist/options.js";

const parse = newUrlPatternParser(defaultOptions);

test('astNodeToRegexString and astNodeToNames', function(t) {
  t.test('just static alphanumeric', function(t) {
    const parsed = parse('user42');
    t.equal(astNodeToRegexString(parsed.value), '^user42$');
    t.deepEqual(astNodeToNames(parsed.value), []);
    t.end();
  });

  t.test('just static escaped', function(t) {
    const parsed = parse('/api/v1/users');
    t.equal(astNodeToRegexString(parsed.value), '^\\/api\\/v1\\/users$');
    t.deepEqual(astNodeToNames(parsed.value), []);
    t.end();
  });

  t.test('just single char variable', function(t) {
    const parsed = parse(':a');
    t.equal(astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$');
    t.deepEqual(astNodeToNames(parsed.value), ['a']);
    t.end();
  });

  t.test('just variable', function(t) {
    const parsed = parse(':variable');
    t.equal(astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$');
    t.deepEqual(astNodeToNames(parsed.value), ['variable']);
    t.end();
  });

  t.test('just wildcard', function(t) {
    const parsed = parse('*');
    t.equal(astNodeToRegexString(parsed.value), '^(.*?)$');
    t.deepEqual(astNodeToNames(parsed.value), ['_']);
    t.end();
  });

  t.test('just optional static', function(t) {
    const parsed = parse('(foo)');
    t.equal(astNodeToRegexString(parsed.value), '^(?:foo)?$');
    t.deepEqual(astNodeToNames(parsed.value), []);
    t.end();
  });

  t.test('just optional variable', function(t) {
    const parsed = parse('(:foo)');
    t.equal(astNodeToRegexString(parsed.value), '^(?:([a-zA-Z0-9-_~ %]+))?$');
    t.deepEqual(astNodeToNames(parsed.value), ['foo']);
    t.end();
  });

  t.test('just optional wildcard', function(t) {
    const parsed = parse('(*)');
    t.equal(astNodeToRegexString(parsed.value), '^(?:(.*?))?$');
    t.deepEqual(astNodeToNames(parsed.value), ['_']);
    t.end();
  });
});

test('getParam', function(t) {
  t.test('no side effects', function(t) {
    let next = {};
    t.equal(undefined, getParam({}, 'one', next));
    t.deepEqual(next, {});

    // value

    next = {};
    t.equal(1, getParam({one: 1}, 'one', next));
    t.deepEqual(next, {});

    next = {one: 0};
    t.equal(1, getParam({one: 1}, 'one', next));
    t.deepEqual(next, {one: 0});

    next = {one: 1};
    t.equal(undefined, getParam({one: 1}, 'one', next));
    t.deepEqual(next, {one: 1});

    next = {one: 2};
    t.equal(undefined, getParam({one: 1}, 'one', next));
    t.deepEqual(next, {one: 2});

    // array

    next = {};
    t.equal(1, getParam({one: [1]}, 'one', next));
    t.deepEqual(next, {});

    next = {one: 0};
    t.equal(1, getParam({one: [1]}, 'one', next));
    t.deepEqual(next, {one: 0});

    next = {one: 1};
    t.equal(undefined, getParam({one: [1]}, 'one', next));
    t.deepEqual(next, {one: 1});

    next = {one: 2};
    t.equal(undefined, getParam({one: [1]}, 'one', next));
    t.deepEqual(next, {one: 2});

    next = {one: 0};
    t.equal(1, getParam({one: [1, 2, 3]}, 'one', next));
    t.deepEqual(next, {one: 0});

    next = {one: 1};
    t.equal(2, getParam({one: [1, 2, 3]}, 'one', next));
    t.deepEqual(next, {one: 1});

    next = {one: 2};
    t.equal(3, getParam({one: [1, 2, 3]}, 'one', next));
    t.deepEqual(next, {one: 2});

    next = {one: 3};
    t.equal(undefined, getParam({one: [1, 2, 3]}, 'one', next));
    t.deepEqual(next, {one: 3});

    t.end();
  });

  t.test('side effects', function(t) {
    let next = {};
    t.equal(1, getParam({one: 1}, 'one', next, true));
    t.deepEqual(next, {one: 1});

    next = {one: 0};
    t.equal(1, getParam({one: 1}, 'one', next, true));
    t.deepEqual(next, {one: 1});

    // array

    next = {};
    t.equal(1, getParam({one: [1]}, 'one', next, true));
    t.deepEqual(next, {one: 1});

    next = {one: 0};
    t.equal(1, getParam({one: [1]}, 'one', next, true));
    t.deepEqual(next, {one: 1});

    next = {one: 0};
    t.equal(1, getParam({one: [1, 2, 3]}, 'one', next, true));
    t.deepEqual(next, {one: 1});

    next = {one: 1};
    t.equal(2, getParam({one: [1, 2, 3]}, 'one', next, true));
    t.deepEqual(next, {one: 2});

    next = {one: 2};
    t.equal(3, getParam({one: [1, 2, 3]}, 'one', next, true));
    t.deepEqual(next, {one: 3});

    t.end();
  });

  t.test('side effects errors', function(t) {
    let e;
    t.plan(2 * 6);

    let next = {};
    try {
      getParam({}, 'one', next, true);
    } catch (error) {
      e = error;
      t.equal(e.message, "no values provided for key `one`");
    }
    t.deepEqual(next, {});

    next = {one: 1};
    try {
      getParam({one: 1}, 'one', next, true);
    } catch (error1) {
      e = error1;
      t.equal(e.message, "too few values provided for key `one`");
    }
    t.deepEqual(next, {one: 1});

    next = {one: 2};
    try {
      getParam({one: 2}, 'one', next, true);
    } catch (error2) {
      e = error2;
      t.equal(e.message, "too few values provided for key `one`");
    }
    t.deepEqual(next, {one: 2});

    next = {one: 1};
    try {
      getParam({one: [1]}, 'one', next, true);
    } catch (error3) {
      e = error3;
      t.equal(e.message, "too few values provided for key `one`");
    }
    t.deepEqual(next, {one: 1});

    next = {one: 2};
    try {
      getParam({one: [1]}, 'one', next, true);
    } catch (error4) {
      e = error4;
      t.equal(e.message, "too few values provided for key `one`");
    }
    t.deepEqual(next, {one: 2});

    next = {one: 3};
    try {
      getParam({one: [1, 2, 3]}, 'one', next, true);
    } catch (error5) {
      e = error5;
      t.equal(e.message, "too few values provided for key `one`");
    }
    t.deepEqual(next, {one: 3});

    t.end();
  });
});
