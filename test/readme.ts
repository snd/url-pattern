// tests for all the examples in the readme

import * as tape from "tape";

import UrlPattern from "../src/url-pattern";

tape("match a pattern against a string and extract values", (t: tape.Test) => {
  const pattern = new UrlPattern("/api/users(/:id)");
  t.deepEqual(pattern.match("/api/users/10"), {id: "10"});
  t.deepEqual(pattern.match("/api/users"), {});
  t.equal(pattern.match("/api/products/5"), undefined);
  t.end();
});

tape("generate a string from a pattern and values", (t: tape.Test) => {
  const pattern = new UrlPattern("/api/users(/:id)");
  t.equal(pattern.stringify(), "/api/users");
  t.equal(pattern.stringify({id: 20}), "/api/users/20");
  t.end();
});

tape("prefer a different syntax. customize it", (t: tape.Test) => {
  const options = {
    segmentNameEndChar: "}",
    segmentNameStartChar: "{",
  };

  const pattern = new UrlPattern(
    "/api/users/{id}",
    options,
  );

  t.deepEqual(pattern.match("/api/users/5"), {
    id: "5",
  });
  t.end();
});

tape("api versioning", (t: tape.Test) => {
  const pattern = new UrlPattern("/v:major(.:minor)/*");
  t.deepEqual(pattern.match("/v1.2/"), {major: "1", minor: "2", _: ""});
  t.deepEqual(pattern.match("/v2/users"), {major: "2", _: "users"});
  t.equal(pattern.match("/v/"), undefined);
  t.end();
});

tape("domain", (t: tape.Test) => {
  const pattern = new UrlPattern("(http(s)\\://)(:subdomain.):domain.:tld(\\::port)(/*)");
  t.deepEqual(pattern.match("google.de"), {
    domain: "google",
    tld: "de",
  },
  );
  t.deepEqual(pattern.match("https://www.google.com"), {
    domain: "google",
    subdomain: "www",
    tld: "com",
  },
  );
  t.deepEqual(pattern.match("http://mail.google.com/mail"), {
    _: "mail",
    domain: "google",
    subdomain: "mail",
    tld: "com",
  },
  );
  t.deepEqual(pattern.match("http://mail.google.com:80/mail"), {
    _: "mail",
    domain: "google",
    port: "80",
    subdomain: "mail",
    tld: "com",
  },
  );
  t.equal(pattern.match("google"), undefined);

  t.deepEqual(pattern.match("www.google.com"), {
    domain: "google",
    subdomain: "www",
    tld: "com",
  },
  );
  t.equal(pattern.match("httpp://mail.google.com/mail"), undefined);
  t.deepEqual(pattern.match("google.de/search"), {
    _: "search",
    domain: "google",
    tld: "de",
  },
  );

  t.end();
});

tape("named segment occurs more than once", (t: tape.Test) => {
  const pattern = new UrlPattern("/api/users/:ids/posts/:ids");
  t.deepEqual(pattern.match("/api/users/10/posts/5"), {ids: ["10", "5"]});
  t.end();
});

tape("regex", (t: tape.Test) => {
  const pattern = new UrlPattern(/^\/api\/(.*)$/);
  t.deepEqual(pattern.match("/api/users"), ["users"]);
  t.equal(pattern.match("/apiii/users"), undefined);
  t.end();
});

tape("regex group names", (t: tape.Test) => {
  const pattern = new UrlPattern(/^\/api\/([^\/]+)(?:\/(\d+))?$/, ["resource", "id"]);
  t.deepEqual(pattern.match("/api/users"),
    {resource: "users"});
  t.equal(pattern.match("/api/users/"), undefined);
  t.deepEqual(pattern.match("/api/users/5"), {
    id: "5",
    resource: "users",
  },
  );
  t.equal(pattern.match("/api/users/foo"), undefined);
  t.end();
});

tape("stringify", (t: tape.Test) => {
  let pattern = new UrlPattern("/api/users/:id");
  t.equal("/api/users/10", pattern.stringify({id: 10}));

  pattern = new UrlPattern("/api/users(/:id)");
  t.equal("/api/users", pattern.stringify());
  t.equal("/api/users/10", pattern.stringify({id: 10}));

  t.end();
});

tape("customization", (t: tape.Test) => {
  const options = {
    escapeChar: "!",
    optionalSegmentEndChar: "]",
    optionalSegmentStartChar: "[",
    segmentNameCharset: "a-zA-Z0-9_-",
    segmentNameStartChar: "$",
    segmentValueCharset: "a-zA-Z0-9",
    wildcardChar: "?",
  };

  const pattern = new UrlPattern(
    "[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]",
    options,
  );

  t.deepEqual(pattern.match("google.de"), {
    "domain": "google",
    "toplevel-domain": "de",
  },
  );
  t.deepEqual(pattern.match("http://mail.google.com/mail"), {
    "_": "mail",
    "domain": "google",
    "sub_domain": "mail",
    "toplevel-domain": "com",
  },
  );
  t.equal(pattern.match("http://mail.this-should-not-match.com/mail"), undefined);
  t.equal(pattern.match("google"), undefined);
  t.deepEqual(pattern.match("www.google.com"), {
    "domain": "google",
    "sub_domain": "www",
    "toplevel-domain": "com",
  },
  );
  t.deepEqual(pattern.match("https://www.google.com"), {
    "domain": "google",
    "sub_domain": "www",
    "toplevel-domain": "com",
  },
  );
  t.equal(pattern.match("httpp://mail.google.com/mail"), undefined);
  t.deepEqual(pattern.match("google.de/search"), {
    "_": "search",
    "domain": "google",
    "toplevel-domain": "de",
  },
  );
  t.end();
});
