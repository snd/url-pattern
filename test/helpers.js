/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const test = require('tape');
const {
  escapeStringForRegex,
  concatMap,
  stringConcatMap,
  regexGroupCount,
  keysAndValuesToObject
} = require('../index.js');

test('escapeStringForRegex', function(t) {
  const expected = '\\[\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}\\]';
  const actual = escapeStringForRegex('[-\/\\^$*+?.()|[\]{}]');
  t.equal(expected, actual);

  t.equal(escapeStringForRegex('a$98kdjf(kdj)'), 'a\\$98kdjf\\(kdj\\)');
  t.equal('a', escapeStringForRegex('a'));
  t.equal('!', escapeStringForRegex('!'));
  t.equal('\\.', escapeStringForRegex('.'));
  t.equal('\\/', escapeStringForRegex('/'));
  t.equal('\\-', escapeStringForRegex('-'));
  t.equal('\\-', escapeStringForRegex('-'));
  t.equal('\\[', escapeStringForRegex('['));
  t.equal('\\]', escapeStringForRegex(']'));
  t.equal('\\(', escapeStringForRegex('('));
  t.equal('\\)', escapeStringForRegex(')'));
  return t.end();
});

test('concatMap', function(t) {
  t.deepEqual([], concatMap([], function() {}));
  t.deepEqual([1], concatMap([1], x => [x]));
  t.deepEqual([1, 1, 1, 2, 2, 2, 3, 3, 3], concatMap([1, 2, 3], x => [x, x, x]));
  return t.end();
});

test('stringConcatMap', function(t) {
  t.equal('', stringConcatMap([], function() {}));
  t.equal('1', stringConcatMap([1], x => x));
  t.equal('123', stringConcatMap([1, 2, 3], x => x));
  t.equal('1a2a3a', stringConcatMap([1, 2, 3], x => x + 'a'));
  return t.end();
});

test('regexGroupCount', function(t) {
  t.equal(0, regexGroupCount(/foo/));
  t.equal(1, regexGroupCount(/(foo)/));
  t.equal(2, regexGroupCount(/((foo))/));
  t.equal(2, regexGroupCount(/(fo(o))/));
  t.equal(2, regexGroupCount(/f(o)(o)/));
  t.equal(2, regexGroupCount(/f(o)o()/));
  t.equal(5, regexGroupCount(/f(o)o()()(())/));
  return t.end();
});

test('keysAndValuesToObject', function(t) {
  t.deepEqual(
    keysAndValuesToObject(
      [],
      []
    ),
    {}
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one'],
      [1]
    ),
    {
      one: 1
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two'],
      [1, 2, 3]
    ),
    {
      one: 1,
      two: [2, 3]
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two'],
      [1, 2, 3, null]
    ),
    {
      one: 1,
      two: [2, 3]
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two'],
      [1, 2, 3, 4]
    ),
    {
      one: 1,
      two: [2, 3, 4]
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three'],
      [1, 2, 3, 4, undefined]
    ),
    {
      one: 1,
      two: [2, 3, 4]
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three'],
      [1, 2, 3, 4, 5]
    ),
    {
      one: 1,
      two: [2, 3, 4],
      three: 5
    }
  );
  t.deepEqual(
    keysAndValuesToObject(
      ['one', 'two', 'two', 'two', 'three'],
      [null, 2, 3, 4, 5]
    ),
    {
      two: [2, 3, 4],
      three: 5
    }
  );
  return t.end();
});
