/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const test = require('tape');
const {
  UrlPattern
} = require('../index.js');

test('invalid argument', function(t) {
  let e;
  UrlPattern;
  t.plan(5);
  try {
    new UrlPattern();
  } catch (error) {
    e = error;
    t.equal(e.message, "first argument must be a RegExp, a string or an instance of UrlPattern");
  }
  try {
    new UrlPattern(5);
  } catch (error1) {
    e = error1;
    t.equal(e.message, "first argument must be a RegExp, a string or an instance of UrlPattern");
  }
  try {
    new UrlPattern('');
  } catch (error2) {
    e = error2;
    t.equal(e.message, "first argument must not be the empty string");
  }
  try {
    new UrlPattern(' ');
  } catch (error3) {
    e = error3;
    t.equal(e.message, "first argument must not contain whitespace");
  }
  try {
    new UrlPattern(' fo o');
  } catch (error4) {
    e = error4;
    t.equal(e.message, "first argument must not contain whitespace");
  }
  return t.end();
});

test('invalid variable name in pattern', function(t) {
  let e;
  UrlPattern;
  t.plan(3);
  try {
    new UrlPattern(':');
  } catch (error) {
    e = error;
    t.equal(e.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern(':.');
  } catch (error1) {
    e = error1;
    t.equal(e.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern('foo:.');
  } catch (error2) {
    // TODO `:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 4
    e = error2;
    t.equal(e.message, "could only partially parse pattern");
  }
  return t.end();
});

test('too many closing parentheses', function(t) {
  let e;
  t.plan(2);
  try {
    new UrlPattern(')');
  } catch (error) {
    // TODO did not plan ) at 0
    e = error;
    t.equal(e.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern('((foo)))bar');
  } catch (error1) {
    // TODO did not plan ) at 7
    e = error1;
    t.equal(e.message, "could only partially parse pattern");
  }
  return t.end();
});

test('unclosed parentheses', function(t) {
  let e;
  t.plan(2);
  try {
    new UrlPattern('(');
  } catch (error) {
    // TODO unclosed parentheses at 1
    e = error;
    t.equal(e.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern('(((foo)bar(boo)far)');
  } catch (error1) {
    // TODO unclosed parentheses at 19
    e = error1;
    t.equal(e.message, "couldn't parse pattern");
  }
  return t.end();
});

test('regex names', function(t) {
  let e;
  t.plan(3);
  try {
    new UrlPattern(/x/, 5);
  } catch (error) {
    e = error;
    t.equal(e.message, 'if first argument is a RegExp the second argument may be an Array<String> of group names but you provided something else');
  }
  try {
    new UrlPattern(/(((foo)bar(boo))far)/, []);
  } catch (error1) {
    e = error1;
    t.equal(e.message, "regex contains 4 groups but array of group names contains 0");
  }
  try {
    new UrlPattern(/(((foo)bar(boo))far)/, ['a', 'b']);
  } catch (error2) {
    e = error2;
    t.equal(e.message, "regex contains 4 groups but array of group names contains 2");
  }
  return t.end();
});

test('stringify regex', function(t) {
  t.plan(1);
  const pattern = new UrlPattern(/x/);
  try {
    pattern.stringify();
  } catch (e) {
    t.equal(e.message, "can't stringify patterns generated from a regex");
  }
  return t.end();
});

test('stringify argument', function(t) {
  t.plan(1);
  const pattern = new UrlPattern('foo');
  try {
    pattern.stringify(5);
  } catch (e) {
    t.equal(e.message, "argument must be an object or undefined");
  }
  return t.end();
});
