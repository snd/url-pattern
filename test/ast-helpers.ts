/* tslint:disable:no-shadowed-variable */
import * as tape from "tape";

import {
  newUrlPatternParser,
// @ts-ignore
} from "../src/parser.ts";

import {
  astRootToRegexString,
  astToNames,
// @ts-ignore
} from "../src/ast-helpers.ts";

import {
  defaultOptions,
// @ts-ignore
} from "../src/options.ts";

const parse: any = newUrlPatternParser(defaultOptions);

// test both functions in one go as they are related
// and extract data from the same input
tape("astRootToRegexString and astToNames", (t: tape.Test) => {
  t.test("just static alphanumeric", (t: tape.Test) => {
    const parsed = parse("user42");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset),
      "^user42$");
    t.deepEqual(astToNames(parsed.value), []);
    t.end();
  });

  t.test("just static escaped", (t: tape.Test) => {
    const parsed = parse("/api/v1/users");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^\\/api\\/v1\\/users$");
    t.deepEqual(astToNames(parsed.value), []);
    t.end();
  });

  t.test("just single char variable", (t: tape.Test) => {
    const parsed = parse(":a");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^([a-zA-Z0-9-_~ %]+)$");
    t.deepEqual(astToNames(parsed.value), ["a"]);
    t.end();
  });

  t.test("just variable", (t: tape.Test) => {
    const parsed = parse(":variable");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^([a-zA-Z0-9-_~ %]+)$");
    t.deepEqual(astToNames(parsed.value), ["variable"]);
    t.end();
  });

  t.test("just wildcard", (t: tape.Test) => {
    const parsed = parse("*");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^.*?$");
    t.deepEqual(astToNames(parsed.value), []);
    t.end();
  });

  t.test("just named wildcard", (t: tape.Test) => {
    const parsed = parse("*:variable");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^(.*?)$");
    t.deepEqual(astToNames(parsed.value), ["variable"]);
    t.end();
  });

  t.test("just optional static", (t: tape.Test) => {
    const parsed = parse("(foo)");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^(?:foo)?$");
    t.deepEqual(astToNames(parsed.value), []);
    t.end();
  });

  t.test("just optional variable", (t: tape.Test) => {
    const parsed = parse("(:foo)");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^(?:([a-zA-Z0-9-_~ %]+))?$");
    t.deepEqual(astToNames(parsed.value), ["foo"]);
    t.end();
  });

  t.test("just optional wildcard", (t: tape.Test) => {
    const parsed = parse("(*)");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^(?:.*?)?$");
    t.deepEqual(astToNames(parsed.value), []);
    t.end();
  });

  t.test("just optional named wildcard", (t: tape.Test) => {
    const parsed = parse("(*:variable)");
    t.equal(astRootToRegexString(parsed.value, defaultOptions.segmentValueCharset), "^(?:(.*?))?$");
    t.deepEqual(astToNames(parsed.value), ["variable"]);
    t.end();
  });
});
