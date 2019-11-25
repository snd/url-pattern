// tests to ensure that there are no regressions in matching functionality
//
// tslint:disable:max-line-length
import * as tape from "tape";

// @ts-ignore
import UrlPattern from "../src/url-pattern.ts";

tape("match", (t: tape.Test) => {
  let pattern = new UrlPattern("/foo");
  t.deepEqual(pattern.match("/foo"), {});

  pattern = new UrlPattern(".foo");
  t.deepEqual(pattern.match(".foo"), {});

  pattern = new UrlPattern("/foo");
  t.equals(pattern.match("/foobar"), undefined);

  pattern = new UrlPattern(".foo");
  t.equals(pattern.match(".foobar"), undefined);

  pattern = new UrlPattern("/foo");
  t.equals(pattern.match("/bar/foo"), undefined);

  pattern = new UrlPattern(".foo");
  t.equals(pattern.match(".bar.foo"), undefined);

  pattern = new UrlPattern(/foo/, []);
  t.deepEqual(pattern.match("foo"), []);

  pattern = new UrlPattern(/\/foo\/(.*)/, ["path"]);
  t.deepEqual(pattern.match("/foo/bar"), {path: "bar"});
  t.deepEqual(pattern.match("/foo/"), {path: ""});

  pattern = new UrlPattern("/user/:userId/task/:taskId");
  t.deepEqual(pattern.match("/user/10/task/52"), {
    taskId: "52",
    userId: "10",
  });

  pattern = new UrlPattern(".user.:userId.task.:taskId");
  t.deepEqual(pattern.match(".user.10.task.52"), {
    taskId: "52",
    userId: "10",
  });

  pattern = new UrlPattern("*/user/:userId");
  t.deepEqual(pattern.match("/school/10/user/10"), {
    userId: "10",
  });

  pattern = new UrlPattern("*:prefix/user/:userId");
  t.deepEqual(pattern.match("/school/10/user/10"), {
    prefix: "/school/10",
    userId: "10",
  });

  pattern = new UrlPattern("*-user-:userId");
  t.deepEqual(pattern.match("-school-10-user-10"), {
    userId: "10",
  });

  pattern = new UrlPattern("*:prefix-user-:userId");
  t.deepEqual(pattern.match("-school-10-user-10"), {
    prefix: "-school-10",
    userId: "10",
  });

  pattern = new UrlPattern("/admin*");
  t.deepEqual(pattern.match("/admin/school/10/user/10"), {});

  pattern = new UrlPattern("/admin*:suffix");
  t.deepEqual(pattern.match("/admin/school/10/user/10"), {
    suffix: "/school/10/user/10",
  });
  t.deepEqual(pattern.match("/admin"), {
    suffix: "",
  });

  pattern = new UrlPattern("/admin(*:suffix)");
  t.deepEqual(pattern.match("/admin/school/10/user/10"), {
    suffix: "/school/10/user/10",
  });
  t.deepEqual(pattern.match("/admin"), {});

  pattern = new UrlPattern("#admin*");
  t.deepEqual(pattern.match("#admin#school#10#user#10"), {});

  pattern = new UrlPattern("#admin*:suffix");
  t.deepEqual(pattern.match("#admin#school#10#user#10"), {
    suffix: "#school#10#user#10",
  });

  pattern = new UrlPattern("/admin/*/user/:userId");
  t.deepEqual(pattern.match("/admin/school/10/user/10"), {
    userId: "10",
  });

  pattern = new UrlPattern("/admin/*:infix/user/:userId");
  t.deepEqual(pattern.match("/admin/school/10/user/10"), {
    infix: "school/10",
    userId: "10",
  });

  pattern = new UrlPattern("$admin$*$user$:userId");
  t.deepEqual(pattern.match("$admin$school$10$user$10"), {
    userId: "10",
  });

  pattern = new UrlPattern("$admin$*:infix$user$:userId");
  t.deepEqual(pattern.match("$admin$school$10$user$10"), {
    infix: "school$10",
    userId: "10",
  });

  pattern = new UrlPattern("/admin/*/user/*/tail");
  t.deepEqual(pattern.match("/admin/school/10/user/10/12/tail"), {});

  pattern = new UrlPattern("/admin/*:infix1/user/*:infix2/tail");
  t.deepEqual(pattern.match("/admin/school/10/user/10/12/tail"), {
    infix1: "school/10",
    infix2: "10/12",
  });

  pattern = new UrlPattern("/admin/*/user/:id/*/tail");
  t.deepEqual(pattern.match("/admin/school/10/user/10/12/13/tail"), {
    id: "10",
  });

  pattern = new UrlPattern("/admin/*:infix1/user/:id/*:infix2/tail");
  t.deepEqual(pattern.match("/admin/school/10/user/10/12/13/tail"), {
    id: "10",
    infix1: "school/10",
    infix2: "12/13",
  });

  pattern = new UrlPattern("/*/admin(/:path)");
  t.deepEqual(pattern.match("/admin/admin/admin"), {
    path: "admin",
  });

  pattern = new UrlPattern("/*:infix/admin(/:path)");
  t.deepEqual(pattern.match("/admin/admin/admin"), {
    infix: "admin",
    path: "admin",
  });

  pattern = new UrlPattern("(/)");
  t.deepEqual(pattern.match(""), {});
  t.deepEqual(pattern.match("/"), {});

  pattern = new UrlPattern("/admin(/foo)/bar");
  t.deepEqual(pattern.match("/admin/foo/bar"), {});
  t.deepEqual(pattern.match("/admin/bar"), {});

  pattern = new UrlPattern("/admin(/:foo)/bar");
  t.deepEqual(pattern.match("/admin/baz/bar"),
    {foo: "baz"});
  t.deepEqual(pattern.match("/admin/bar"), {});

  pattern = new UrlPattern("/admin/(*/)foo");
  t.deepEqual(pattern.match("/admin/foo"), {});
  t.deepEqual(pattern.match("/admin/baz/bar/biff/foo"), {});

  pattern = new UrlPattern("/admin/(*:infix/)foo");
  t.deepEqual(pattern.match("/admin/foo"), {});
  t.deepEqual(pattern.match("/admin/baz/bar/biff/foo"), {
    infix: "baz/bar/biff",
  });

  pattern = new UrlPattern("/v:major.:minor/*");
  t.deepEqual(pattern.match("/v1.2/resource/"), {
    major: "1",
    minor: "2",
  });

  pattern = new UrlPattern("/v:major.:minor/*:suffix");
  t.deepEqual(pattern.match("/v1.2/resource/"), {
    major: "1",
    minor: "2",
    suffix: "resource/",
  });

  pattern = new UrlPattern("/v:minor.:major/*");
  t.deepEqual(pattern.match("/v1.2/resource/"), {
    major: "2",
    minor: "1",
  });

  pattern = new UrlPattern("/v:minor.:major/*:suffix");
  t.deepEqual(pattern.match("/v1.2/resource/"), {
    major: "2",
    minor: "1",
    suffix: "resource/",
  });

  pattern = new UrlPattern("/:foo_bar");
  t.deepEqual(pattern.match("/_bar"),
    {foo_bar: "_bar"});
  t.deepEqual(pattern.match("/a_bar"),
    {foo_bar: "a_bar"});
  t.deepEqual(pattern.match("/a__bar"),
    {foo_bar: "a__bar"});
  t.deepEqual(pattern.match("/a-b-c-d__bar"),
    {foo_bar: "a-b-c-d__bar"});
  t.deepEqual(pattern.match("/a b%c-d__bar"),
    {foo_bar: "a b%c-d__bar"});

  pattern = new UrlPattern("((((a)b)c)d)");
  t.deepEqual(pattern.match(""), {});
  t.equal(pattern.match("a"), undefined);
  t.equal(pattern.match("ab"), undefined);
  t.equal(pattern.match("abc"), undefined);
  t.deepEqual(pattern.match("abcd"), {});
  t.deepEqual(pattern.match("bcd"), {});
  t.deepEqual(pattern.match("cd"), {});
  t.deepEqual(pattern.match("d"), {});

  pattern = new UrlPattern("/user/:range");
  t.deepEqual(pattern.match("/user/10-20"),
    {range: "10-20"});

  pattern = new UrlPattern("/user/:range");
  t.deepEqual(pattern.match("/user/10_20"),
    {range: "10_20"});

  pattern = new UrlPattern("/user/:range");
  t.deepEqual(pattern.match("/user/10 20"),
    {range: "10 20"});

  pattern = new UrlPattern("/user/:range");
  t.deepEqual(pattern.match("/user/10%20"),
    {range: "10%20"});

  pattern = new UrlPattern("/vvv:version/*");
  t.equal(undefined, pattern.match("/vvv/resource"));
  t.deepEqual(pattern.match("/vvv1/resource"), {
    version: "1",
  });
  t.equal(undefined, pattern.match("/vvv1.1/resource"));

  pattern = new UrlPattern("/vvv:version/*:suffix");
  t.equal(undefined, pattern.match("/vvv/resource"));
  t.deepEqual(pattern.match("/vvv1/resource"), {
    suffix: "resource",
    version: "1",
  });
  t.equal(undefined, pattern.match("/vvv1.1/resource"));

  pattern = new UrlPattern("/api/users/:id",
    {segmentValueCharset: "a-zA-Z0-9-_~ %.@"});
  t.deepEqual(pattern.match("/api/users/someuser@example.com"),
    {id: "someuser@example.com"});

  pattern = new UrlPattern("/api/users?username=:username",
    {segmentValueCharset: "a-zA-Z0-9-_~ %.@"});
  t.deepEqual(pattern.match("/api/users?username=someone@example.com"),
    {username: "someone@example.com"});

  pattern = new UrlPattern("/api/users?param1=:param1&param2=:param2");
  t.deepEqual(pattern.match("/api/users?param1=foo&param2=bar"), {
    param1: "foo",
    param2: "bar",
  });

  pattern = new UrlPattern(":scheme\\://:host(\\::port)",
    {segmentValueCharset: "a-zA-Z0-9-_~ %."});
  t.deepEqual(pattern.match("ftp://ftp.example.com"), {
    host: "ftp.example.com",
    scheme: "ftp",
  });
  t.deepEqual(pattern.match("ftp://ftp.example.com:8080"), {
    host: "ftp.example.com",
    port: "8080",
    scheme: "ftp",
  });
  t.deepEqual(pattern.match("https://example.com:80"), {
    host: "example.com",
    port: "80",
    scheme: "https",
  });

  pattern = new UrlPattern(":scheme\\://:host(\\::port)(/api(/:resource(/:id)))",
    {segmentValueCharset: "a-zA-Z0-9-_~ %.@"});
  t.deepEqual(pattern.match("https://sss.www.localhost.com"), {
    host: "sss.www.localhost.com",
    scheme: "https",
  });
  t.deepEqual(pattern.match("https://sss.www.localhost.com:8080"), {
    host: "sss.www.localhost.com",
    port: "8080",
    scheme: "https",
  });
  t.deepEqual(pattern.match("https://sss.www.localhost.com/api"), {
    host: "sss.www.localhost.com",
    scheme: "https",
  });
  t.deepEqual(pattern.match("https://sss.www.localhost.com/api/security"), {
    host: "sss.www.localhost.com",
    resource: "security",
    scheme: "https",
  });
  t.deepEqual(pattern.match("https://sss.www.localhost.com/api/security/bob@example.com"), {
    host: "sss.www.localhost.com",
    id: "bob@example.com",
    resource: "security",
    scheme: "https",
  });

  const regex = /\/ip\/((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?))$/;
  pattern = new UrlPattern(regex, ["ip"]);
  t.equal(undefined, pattern.match("10.10.10.10"));
  t.equal(undefined, pattern.match("ip/10.10.10.10"));
  t.equal(undefined, pattern.match("/ip/10.10.10."));
  t.equal(undefined, pattern.match("/ip/10."));
  t.equal(undefined, pattern.match("/ip/"));
  t.deepEqual(pattern.match("/ip/10.10.10.10"),
    {ip: "10.10.10.10"});
  t.deepEqual(pattern.match("/ip/127.0.0.1"),
    {ip: "127.0.0.1"});

  pattern = new UrlPattern("https\\://translate.google.com/translate?sl=auto&tl=:targetLanguage&u=:url", {
    segmentValueCharset: "a-zA-Z0-9-_~ %.",
  });
  t.deepEqual(pattern.match("https://translate.google.com/translate?sl=auto&tl=es&u=yahoo.com"), {
    targetLanguage: "es",
    url: "yahoo.com",
  });

  pattern = new UrlPattern("https\\://translate.google.com/translate?sl=auto&tl=:target_language&u=:url", {
    segmentValueCharset: "a-zA-Z0-9-_~ %.",
  });
  t.deepEqual(pattern.match("https://translate.google.com/translate?sl=auto&tl=es&u=yahoo.com"), {
    target_language: "es",
    url: "yahoo.com",
  });

  t.end();
});
