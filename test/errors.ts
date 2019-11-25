/* tslint:disable:no-unused-expression */
import * as tape from "tape";

// @ts-ignore
import UrlPattern from "../src/url-pattern.ts";

const UntypedUrlPattern: any = UrlPattern;

tape("invalid argument", (t: tape.Test) => {
  t.plan(6);

  try {
    new UntypedUrlPattern();
  } catch (error) {
    t.equal(error.message, "first argument must be a RegExp, a string or an instance of UrlPattern");
  }
  try {
    new UntypedUrlPattern(5);
  } catch (error) {
    t.equal(error.message, "first argument must be a RegExp, a string or an instance of UrlPattern");
  }
  try {
    new UrlPattern("");
  } catch (error) {
    t.equal(error.message, "first argument must not be the empty string");
  }
  try {
    new UrlPattern(" ");
  } catch (error) {
    t.equal(error.message, "first argument must not contain whitespace");
  }
  try {
    new UrlPattern(" fo o");
  } catch (error) {
    t.equal(error.message, "first argument must not contain whitespace");
  }
  try {
    const str: any = "foo";
    new UrlPattern(str, []);
  } catch (error) {
    t.equal(error.message, "if first argument is a string second argument must be an options object or undefined");
  }
  t.end();
});

tape("invalid variable name in pattern", (t: tape.Test) => {
  t.plan(3);
  try {
    new UrlPattern(":");
  } catch (error) {
    t.equal(error.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern(":.");
  } catch (error) {
    t.equal(error.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern("foo:.");
  } catch (error) {
    t.equal(error.message, [
      "could only partially parse pattern.",
      "failure at character 4 in pattern:",
      "foo:.",
      "   ^ parsing failed here",
    ].join("\n"));
  }
  t.end();
});

tape("duplicate variable name in pattern", (t: tape.Test) => {
  t.plan(1);
  try {
    new UrlPattern(":a/:a");
  } catch (error) {
    t.equal(error.message, "duplicate name \"a\" in pattern. names must be unique");
  }
  t.end();
});

tape("too many closing parentheses", (t: tape.Test) => {
  t.plan(2);
  try {
    new UrlPattern(")");
  } catch (error) {
    t.equal(error.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern("((foo)))bar");
  } catch (error) {
    t.equal(error.message, [
      "could only partially parse pattern.",
      "failure at character 8 in pattern:",
      "((foo)))bar",
      "       ^ parsing failed here",
    ].join("\n"));
  }
  t.end();
});

tape("unclosed parentheses", (t: tape.Test) => {
  t.plan(2);
  try {
    new UrlPattern("(");
  } catch (error) {
    t.equal(error.message, "couldn't parse pattern");
  }
  try {
    new UrlPattern("(((foo)bar(boo)far)");
  } catch (error) {
    t.equal(error.message, "couldn't parse pattern");
  }
  t.end();
});

tape("regex names", (t: tape.Test) => {
  t.plan(4);
  try {
    new UntypedUrlPattern(/x/, 5);
  } catch (error) {
    t.equal(error.message,
      "if first argument is a RegExp the second argument must be an Array<String> of group names",
    );
  }
  try {
    new UrlPattern(/(((foo)bar(boo))far)/, []);
  } catch (error) {
    t.equal(error.message, "regex contains 4 groups but array of group names contains 0");
  }
  try {
    new UrlPattern(/(((foo)bar(boo))far)/, ["a", "b"]);
  } catch (error) {
    t.equal(error.message, "regex contains 4 groups but array of group names contains 2");
  }
  try {
    new UrlPattern(/(\d).(\d).(\d)/, ["a", "b", "a"]);
  } catch (error) {
    t.equal(error.message, "duplicate group name \"a\". group names must be unique");
  }
  t.end();
});

tape("stringify regex", (t: tape.Test) => {
  t.plan(1);
  const pattern = new UrlPattern(/x/, []);
  try {
    pattern.stringify();
  } catch (error) {
    t.equal(error.message, "can't stringify patterns generated from a regex");
  }
  t.end();
});

tape("stringify argument", (t: tape.Test) => {
  t.plan(1);
  const pattern = new UntypedUrlPattern("foo");
  try {
    pattern.stringify(5);
  } catch (error) {
    t.equal(error.message, "argument must be an object or undefined");
  }
  t.end();
});
