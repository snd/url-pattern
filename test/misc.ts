import * as tape from "tape";

import UrlPattern from "../src/url-pattern";

tape("instance of UrlPattern is handled correctly as constructor argument", (t: tape.Test) => {
  const pattern = new UrlPattern("/user/:userId/task/:taskId");
  const copy = new UrlPattern(pattern);
  t.deepEqual(copy.match("/user/10/task/52"), {
    taskId: "52",
    userId: "10",
  },
  );
  t.end();
});

tape("match full stops in segment values", (t: tape.Test) => {
  const options = {
    segmentValueCharset: "a-zA-Z0-9-_ %.",
  };
  const pattern = new UrlPattern("/api/v1/user/:id/", options);
  t.deepEqual(pattern.match("/api/v1/user/test.name/"),
    {id: "test.name"});
  t.end();
});

tape("regex group names", (t: tape.Test) => {
  const pattern = new UrlPattern(/^\/api\/([a-zA-Z0-9-_~ %]+)(?:\/(\d+))?$/, ["resource", "id"]);
  t.deepEqual(pattern.match("/api/users"),
    {resource: "users"});
  t.equal(pattern.match("/apiii/users"), undefined);
  t.deepEqual(pattern.match("/api/users/foo"), undefined);
  t.deepEqual(pattern.match("/api/users/10"), {
    id: "10",
    resource: "users",
  },
  );
  t.deepEqual(pattern.match("/api/projects/10/"), undefined);
  t.end();
});
