import * as tape from "tape";

import {
  newRegexParser,
  newStringParser,
} from "../src/parser-combinators";

tape("newStringParser", (t: tape.Test) => {
  const parse = newStringParser("foo");
  t.deepEqual(parse("foo"), {
    rest: "",
    value: "foo",
  });
  t.deepEqual(parse("foobar"), {
    rest: "bar",
    value: "foo",
  });
  t.equal(parse("bar"), undefined);
  t.equal(parse(""), undefined);
  t.end();
});

tape("newRegexParser", (t: tape.Test) => {
  const parse = newRegexParser(/^[a-zA-Z0-9]+/);
  t.deepEqual(parse("foobar"), {
    rest: "",
    value: "foobar",
  });
  t.equal(parse("_aa"), undefined);
  t.deepEqual(parse("a"), {
    rest: "",
    value: "a",
  });
  t.deepEqual(parse("foo90$bar"), {
    rest: "$bar",
    value: "foo90",
  });
  t.equal(parse(""), undefined);
  t.end();
});
