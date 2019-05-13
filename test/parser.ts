import * as tape from "tape";

import {
  newNamedSegmentParser,
  newNamedWildcardParser,
  newStaticContentParser,
  newUrlPatternParser,
// @ts-ignore
} from "../src/parser.ts";

import {
  defaultOptions,
// @ts-ignore
} from "../src/options.ts";

const parse = newUrlPatternParser(defaultOptions);
const parseNamedSegment = newNamedSegmentParser(defaultOptions);
const parseStaticContent = newStaticContentParser(defaultOptions);
const parseNamedWildcard = newNamedWildcardParser(defaultOptions);

tape("namedSegment", (t: tape.Test) => {
  t.deepEqual(parseNamedSegment(":a"), {
    rest: "",
    value: {
      tag: "namedSegment",
      value: "a",
    },
  },
  );
  t.deepEqual(parseNamedSegment(":ab96c"), {
    rest: "",
    value: {
      tag: "namedSegment",
      value: "ab96c",
    },
  },
  );
  t.deepEqual(parseNamedSegment(":ab96c."), {
    rest: ".",
    value: {
      tag: "namedSegment",
      value: "ab96c",
    },
  },
  );
  t.deepEqual(parseNamedSegment(":96c-:ab"), {
    rest: "-:ab",
    value: {
      tag: "namedSegment",
      value: "96c",
    },
  },
  );
  t.equal(parseNamedSegment(":"), undefined);
  t.equal(parseNamedSegment(""), undefined);
  t.equal(parseNamedSegment("a"), undefined);
  t.equal(parseNamedSegment("abc"), undefined);
  t.end();
});

tape("static", (t: tape.Test) => {
  t.deepEqual(parseStaticContent("a"), {
    rest: "",
    value: {
      tag: "staticContent",
      value: "a",
    },
  },
  );
  t.deepEqual(parseStaticContent("abc:d"), {
    rest: ":d",
    value: {
      tag: "staticContent",
      value: "abc",
    },
  },
  );
  t.equal(parseStaticContent(":ab96c"), undefined);
  t.equal(parseStaticContent(":"), undefined);
  t.equal(parseStaticContent("("), undefined);
  t.equal(parseStaticContent(")"), undefined);
  t.equal(parseStaticContent("*"), undefined);
  t.equal(parseStaticContent(""), undefined);
  t.end();
});

tape("namedWildcard", (t: tape.Test) => {
  t.deepEqual(parseNamedWildcard("*:a"), {
    rest: "",
    value: {
      tag: "namedWildcard",
      value: "a",
    },
  });
  t.end();
});

tape("fixtures", (t: tape.Test) => {
  t.equal(parse(""), undefined);
  t.equal(parse("("), undefined);
  t.equal(parse(")"), undefined);
  t.equal(parse("()"), undefined);
  t.equal(parse(":"), undefined);
  t.equal(parse("((foo)"), undefined);
  t.equal(parse("(((foo)bar(boo)far)"), undefined);

  t.deepEqual(parse("(foo))"), {
    rest: ")",
    value: [
      {tag: "optionalSegment", value: [{tag: "staticContent", value: "foo"}]},
    ],
  });

  t.deepEqual(parse("((foo)))bar"), {
    rest: ")bar",
    value: [
      {
        tag: "optionalSegment",
        value: [
          {tag: "optionalSegment", value: [{tag: "staticContent", value: "foo"}]},
        ],
      },
    ],
  });

  t.deepEqual(parse("foo:*"), {
    rest: ":*",
    value: [
      {tag: "staticContent", value: "foo"},
    ],
  });

  t.deepEqual(parse(":foo:bar"), {
    rest: "",
    value: [
      {tag: "namedSegment", value: "foo"},
      {tag: "namedSegment", value: "bar"},
    ],
  });

  t.deepEqual(parse("a"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "a"},
    ],
  });
  t.deepEqual(parse("user42"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "user42"},
    ],
  });
  t.deepEqual(parse(":a"), {
    rest: "",
    value: [
      {tag: "namedSegment", value: "a"},
    ],
  });
  t.deepEqual(parse("*"), {
    rest: "",
    value: [
      {tag: "wildcard", value: "*"},
    ],
  });
  t.deepEqual(parse("(foo)"), {
    rest: "",
    value: [
      {tag: "optionalSegment", value: [{tag: "staticContent", value: "foo"}]},
    ],
  });
  t.deepEqual(parse("(:foo)"), {
    rest: "",
    value: [
      {tag: "optionalSegment", value: [{tag: "namedSegment", value: "foo"}]},
    ],
  });
  t.deepEqual(parse("(*)"), {
    rest: "",
    value: [
      {tag: "optionalSegment", value: [{tag: "wildcard", value: "*"}]},
    ],
  });

  t.deepEqual(parse("/api/users/:id"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/api/users/"},
      {tag: "namedSegment", value: "id"},
    ],
  });
  t.deepEqual(parse("/v:major(.:minor)/*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/v"},
      {tag: "namedSegment", value: "major"},
      {
        tag: "optionalSegment",
        value: [
          {tag: "staticContent", value: "."},
          {tag: "namedSegment", value: "minor"},
        ],
      },
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
    ],
  });
  t.deepEqual(parse("(http(s)\\://)(:subdomain.):domain.:tld(/*)"), {
    rest: "",
    value: [
      {
        tag: "optionalSegment",
        value: [
          {tag: "staticContent", value: "http"},
          {
            tag: "optionalSegment",
            value: [
              {tag: "staticContent", value: "s"},
            ],
          },
          {tag: "staticContent", value: "://"},
        ],
      },
      {
        tag: "optionalSegment",
        value: [
          {tag: "namedSegment", value: "subdomain"},
          {tag: "staticContent", value: "."},
        ],
      },
      {tag: "namedSegment", value: "domain"},
      {tag: "staticContent", value: "."},
      {tag: "namedSegment", value: "tld"},
      {
        tag: "optionalSegment",
        value: [
          {tag: "staticContent", value: "/"},
          {tag: "wildcard", value: "*"},
        ],
      },
    ],
  });
  t.deepEqual(parse("/api/users/:ids/posts/:ids"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/api/users/"},
      {tag: "namedSegment", value: "ids"},
      {tag: "staticContent", value: "/posts/"},
      {tag: "namedSegment", value: "ids"},
    ],
  });

  t.deepEqual(parse("/user/:userId/task/:taskId"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/user/"},
      {tag: "namedSegment", value: "userId"},
      {tag: "staticContent", value: "/task/"},
      {tag: "namedSegment", value: "taskId"},
    ],
  });

  t.deepEqual(parse(".user.:userId.task.:taskId"), {
    rest: "",
    value: [
      {tag: "staticContent", value: ".user."},
      {tag: "namedSegment", value: "userId"},
      {tag: "staticContent", value: ".task."},
      {tag: "namedSegment", value: "taskId"},
    ],
  });

  t.deepEqual(parse("*/user/:userId"), {
    rest: "",
    value: [
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/user/"},
      {tag: "namedSegment", value: "userId"},
    ],
  });

  t.deepEqual(parse("*-user-:userId"), {
    rest: "",
    value: [
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "-user-"},
      {tag: "namedSegment", value: "userId"},
    ],
  });

  t.deepEqual(parse("/admin*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin"},
      {tag: "wildcard", value: "*"},
    ],
  });

  t.deepEqual(parse("#admin*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "#admin"},
      {tag: "wildcard", value: "*"},
    ],
  });

  t.deepEqual(parse("/admin/*/user/:userId"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/user/"},
      {tag: "namedSegment", value: "userId"},
    ],
  });

  t.deepEqual(parse("$admin$*$user$:userId"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "$admin$"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "$user$"},
      {tag: "namedSegment", value: "userId"},
    ],
  });

  t.deepEqual(parse("/admin/*/user/*/tail"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/user/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/tail"},
    ],
  });

  t.deepEqual(parse("/admin/*/user/:id/*/tail"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/user/"},
      {tag: "namedSegment", value: "id"},
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/tail"},
    ],
  });

  t.deepEqual(parse("^admin^*^user^:id^*^tail"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "^admin^"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "^user^"},
      {tag: "namedSegment", value: "id"},
      {tag: "staticContent", value: "^"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "^tail"},
    ],
  });

  t.deepEqual(parse("/*/admin(/:path)"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
      {tag: "staticContent", value: "/admin"},
      {tag: "optionalSegment", value: [
        {tag: "staticContent", value: "/"},
        {tag: "namedSegment", value: "path"},
      ]},
    ],
  });

  t.deepEqual(parse("/"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/"},
    ],
  });

  t.deepEqual(parse("(/)"), {
    rest: "",
    value: [
      {tag: "optionalSegment", value: [
        {tag: "staticContent", value: "/"},
      ]},
    ],
  });

  t.deepEqual(parse("/admin(/:foo)/bar"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin"},
      {tag: "optionalSegment", value: [
        {tag: "staticContent", value: "/"},
        {tag: "namedSegment", value: "foo"},
      ]},
      {tag: "staticContent", value: "/bar"},
    ],
  });

  t.deepEqual(parse("/admin(*/)foo"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/admin"},
      {tag: "optionalSegment", value: [
        {tag: "wildcard", value: "*"},
        {tag: "staticContent", value: "/"},
      ]},
      {tag: "staticContent", value: "foo"},
    ],
  });

  t.deepEqual(parse("/v:major.:minor/*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/v"},
      {tag: "namedSegment", value: "major"},
      {tag: "staticContent", value: "."},
      {tag: "namedSegment", value: "minor"},
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
    ],
  });

  t.deepEqual(parse("/v:v.:v/*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/v"},
      {tag: "namedSegment", value: "v"},
      {tag: "staticContent", value: "."},
      {tag: "namedSegment", value: "v"},
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
    ],
  });

  t.deepEqual(parse("/:foo_bar"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/"},
      {tag: "namedSegment", value: "foo_bar"},
    ],
  });

  t.deepEqual(parse("((((a)b)c)d)"), {
    rest: "",
    value: [
      {tag: "optionalSegment", value: [
        {tag: "optionalSegment", value: [
          {tag: "optionalSegment", value: [
            {tag: "optionalSegment", value: [
              {tag: "staticContent", value: "a"},
            ]},
            {tag: "staticContent", value: "b"},
          ]},
          {tag: "staticContent", value: "c"},
        ]},
        {tag: "staticContent", value: "d"},
      ]},
    ],
  });

  t.deepEqual(parse("/vvv:version/*"), {
    rest: "",
    value: [
      {tag: "staticContent", value: "/vvv"},
      {tag: "namedSegment", value: "version"},
      {tag: "staticContent", value: "/"},
      {tag: "wildcard", value: "*"},
    ],
  });

  t.end();
});
