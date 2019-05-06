import * as tape from "tape";

import {
  concatMap,
  escapeStringForRegex,
  keysAndValuesToObject,
  regexGroupCount,
  stringConcatMap,
} from "../src/helpers";

tape("escapeStringForRegex", (t: tape.Test) => {
  const expected = "\\[\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}\\]";
  const actual = escapeStringForRegex("[-\/\\^$*+?.()|[\]{}]");
  t.equal(expected, actual);

  t.equal(escapeStringForRegex("a$98kdjf(kdj)"), "a\\$98kdjf\\(kdj\\)");
  t.equal("a", escapeStringForRegex("a"));
  t.equal("!", escapeStringForRegex("!"));
  t.equal("\\.", escapeStringForRegex("."));
  t.equal("\\/", escapeStringForRegex("/"));
  t.equal("\\-", escapeStringForRegex("-"));
  t.equal("\\-", escapeStringForRegex("-"));
  t.equal("\\[", escapeStringForRegex("["));
  t.equal("\\]", escapeStringForRegex("]"));
  t.equal("\\(", escapeStringForRegex("("));
  t.equal("\\)", escapeStringForRegex(")"));
  t.end();
});

tape("concatMap", (t: tape.Test) => {
  t.deepEqual([], concatMap([], () => []));
  t.deepEqual([1], concatMap([1], (x) => [x]));
  t.deepEqual([1, 1, 1, 2, 2, 2, 3, 3, 3], concatMap([1, 2, 3], (x) => [x, x, x]));
  t.end();
});

tape("stringConcatMap", (t: tape.Test) => {
  t.equal("", stringConcatMap([], () => ""));
  t.equal("1", stringConcatMap([1], (x) => x.toString()));
  t.equal("123", stringConcatMap([1, 2, 3], (x) => x.toString()));
  t.equal("1a2a3a", stringConcatMap([1, 2, 3], (x) => x + "a"));
  t.end();
});

tape("regexGroupCount", (t: tape.Test) => {
  t.equal(0, regexGroupCount(/foo/));
  t.equal(1, regexGroupCount(/(foo)/));
  t.equal(2, regexGroupCount(/((foo))/));
  t.equal(2, regexGroupCount(/(fo(o))/));
  t.equal(2, regexGroupCount(/f(o)(o)/));
  t.equal(2, regexGroupCount(/f(o)o()/));
  t.equal(5, regexGroupCount(/f(o)o()()(())/));
  t.end();
});

tape("keysAndValuesToObject", (t: tape.Test) => {
  t.deepEqual(
    keysAndValuesToObject(
      [],
      [],
    ),
    {},
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one"],
      [1],
    ),
    {
      one: 1,
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two"],
      [1, 2, 3],
    ),
    {
      one: 1,
      two: [2, 3],
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two", "two"],
      [1, 2, 3, null],
    ),
    {
      one: 1,
      two: [2, 3],
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two", "two"],
      [1, 2, 3, 4],
    ),
    {
      one: 1,
      two: [2, 3, 4],
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two", "two", "three"],
      [1, 2, 3, 4, undefined],
    ),
    {
      one: 1,
      two: [2, 3, 4],
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two", "two", "three"],
      [1, 2, 3, 4, 5],
    ),
    {
      one: 1,
      three: 5,
      two: [2, 3, 4],
    },
  );
  t.deepEqual(
    keysAndValuesToObject(
      ["one", "two", "two", "two", "three"],
      [null, 2, 3, 4, 5],
    ),
    {
      three: 5,
      two: [2, 3, 4],
    },
  );
  t.end();
});
