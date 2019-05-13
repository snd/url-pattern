// tests to ensure that there are no regressions in stringify functionality

import * as tape from "tape";

import UrlPattern from "../src/url-pattern";

tape("stringify", (t: tape.Test) => {
  let pattern = new UrlPattern("/foo");
  t.equal("/foo", pattern.stringify());

  pattern = new UrlPattern("/user/:userId/task/:taskId");
  t.equal("/user/10/task/52", pattern.stringify({
    taskId: "52",
    userId: "10",
  }));

  pattern = new UrlPattern("/user/:userId/task/:taskId");
  t.equal("/user/10/task/52", pattern.stringify({
    ignored: "ignored",
    taskId: "52",
    userId: "10",
  }));

  pattern = new UrlPattern(".user.:userId.task.:taskId");
  t.equal(".user.10.task.52", pattern.stringify({
    taskId: "52",
    userId: "10",
  }));

  pattern = new UrlPattern("*/user/:userId");
  t.equal("/user/10", pattern.stringify({
    userId: "10",
  }));

  pattern = new UrlPattern("*:prefix/user/:userId");
  t.equal("/school/10/user/10", pattern.stringify({
    prefix: "/school/10",
    userId: "10",
  }));

  pattern = new UrlPattern("*-user-:userId");
  t.equal("-user-10", pattern.stringify({
    userId: "10",
  }));

  pattern = new UrlPattern("*:prefix-user-:userId");
  t.equal("-school-10-user-10", pattern.stringify({
    prefix: "-school-10",
    userId: "10",
  }));

  pattern = new UrlPattern("/admin*");
  t.equal("/admin", pattern.stringify({}));

  pattern = new UrlPattern("/admin*:suffix");
  t.equal("/admin/school/10/user/10", pattern.stringify({
    suffix: "/school/10/user/10",
  }));

  pattern = new UrlPattern("/admin/*/user/*/tail");
  t.equal("/admin//user//tail", pattern.stringify({}));

  pattern = new UrlPattern("/admin/*:infix1/user/*:infix2/tail");
  t.equal("/admin/school/10/user/10/12/tail", pattern.stringify({
    infix1: "school/10",
    infix2: "10/12",
  }));

  pattern = new UrlPattern("/admin/*/user/:id/*/tail");
  t.equal("/admin//user/10//tail", pattern.stringify({
    id: "10",
  }));

  pattern = new UrlPattern("/admin/*:infix1/user/:id/*:infix2/tail");
  t.equal("/admin/school/10/user/10/12/13/tail", pattern.stringify({
    id: "10",
    infix1: "school/10",
    infix2: "12/13",
  }));

  pattern = new UrlPattern("/*/admin(/:path)");
  t.equal("//admin/baz", pattern.stringify({
    path: "baz",
  }));
  t.equal("//admin", pattern.stringify({}));

  pattern = new UrlPattern("/*:infix/admin(/:path)");
  t.equal("/foo/admin/baz", pattern.stringify({
    infix: "foo",
    path: "baz",
  }));
  t.equal("/foo/admin", pattern.stringify({ infix: "foo" }));

  pattern = new UrlPattern("(/)");
  t.equal("", pattern.stringify());

  pattern = new UrlPattern("/admin(/foo)/bar");
  t.equal("/admin/bar", pattern.stringify());

  pattern = new UrlPattern("/admin(/:foo)/bar");
  t.equal("/admin/bar", pattern.stringify());
  t.equal("/admin/baz/bar", pattern.stringify({ foo: "baz" }));

//   pattern = new UrlPattern("/admin/(*/)foo");
//   t.equal("/admin/foo", pattern.stringify());
//   t.equal("/admin/baz/bar/biff/foo", pattern.stringify({ _: "baz/bar/biff" }));
//
//   pattern = new UrlPattern("/v:major.:minor/*");
//   t.equal("/v1.2/resource/", pattern.stringify({
//     _: "resource/",
//     major: "1",
//     minor: "2",
//   }));

  pattern = new UrlPattern("/v:major.:minor/*");
  t.equal("/v1.2/", pattern.stringify({
    major: "1",
    minor: "2",
  }));

  pattern = new UrlPattern("/v:major.:minor/*:suffix");
  t.equal("/v1.2/", pattern.stringify({
    major: "1",
    minor: "2",
    suffix: "",
  }));

  pattern = new UrlPattern("/v:major.:minor/*:suffix");
  t.equal("/v1.2/resource/", pattern.stringify({
    major: "1",
    minor: "2",
    suffix: "resource/",
  }));

  pattern = new UrlPattern("/:foo_bar");
  t.equal("/a_bar", pattern.stringify({ foo_bar: "a_bar" }));
  t.equal("/a__bar", pattern.stringify({ foo_bar: "a__bar" }));
  t.equal("/a-b-c-d__bar", pattern.stringify({ foo_bar: "a-b-c-d__bar" }));
  t.equal("/a b%c-d__bar", pattern.stringify({ foo_bar: "a b%c-d__bar" }));

  pattern = new UrlPattern("((((a)b)c)d)");
  t.equal("", pattern.stringify());

//   pattern = new UrlPattern("(:a-)1-:b(-2-:c-3-:d(-4-*-:a))");
//   t.equal("1-B", pattern.stringify({ b: "B" }));
//   t.equal("A-1-B", pattern.stringify({
//     a: "A",
//     b: "B",
//   }));
//   t.equal("A-1-B", pattern.stringify({
//     a: "A",
//     b: "B",
//   }));
//   t.equal("A-1-B-2-C-3-D", pattern.stringify({
//     a: "A",
//     b: "B",
//     c: "C",
//     d: "D",
//   }));
//   t.equal("A-1-B-2-C-3-D-4-E-F", pattern.stringify({
//     _: "E",
//     a: ["A", "F"],
//     b: "B",
//     c: "C",
//     d: "D",
//   }));

  pattern = new UrlPattern("/user/:range");
  t.equal("/user/10-20", pattern.stringify({ range: "10-20" }));

  t.end();
});

tape("stringify errors", (t: tape.Test) => {
  let e;
  t.plan(3);

  const pattern = new UrlPattern("(:a-)1-:b(-2-:c-3-:d(-4-*-:e))");

  try {
    pattern.stringify();
  } catch (error) {
    e = error;
    t.equal(e.message, "no value provided for name `b`");
  }
  try {
    pattern.stringify({
      a: "A",
      b: "B",
      c: "C",
    });
  } catch (error1) {
    e = error1;
    t.equal(e.message, "no value provided for name `d`");
  }
  try {
    pattern.stringify({
      a: "A",
      b: "B",
      d: "D",
    });
  } catch (error2) {
    e = error2;
    t.equal(e.message, "no value provided for name `c`");
  }

  t.end();
});
