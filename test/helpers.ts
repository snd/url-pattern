import * as tape from "tape";

import {
  escapeStringForRegex,
  indexOfDuplicateElement,
  regexGroupCount,
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

tape("indexOfDuplicateElement", (t: tape.Test) => {
  t.equal(-1, indexOfDuplicateElement([]));
  t.equal(-1, indexOfDuplicateElement([1, 2, 3, 4, 5]));
  t.equal(1, indexOfDuplicateElement([1, 1, 3, 4, 5]));
  t.equal(2, indexOfDuplicateElement([1, 2, 1, 4, 5]));
  t.equal(3, indexOfDuplicateElement([1, 2, 3, 2, 5]));
  t.equal(-1, indexOfDuplicateElement(["a", "b", "c"]));
  t.equal(2, indexOfDuplicateElement(["a", "b", "a"]));
  t.end();
});
