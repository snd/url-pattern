/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const test = require('tape');
const {
  UrlPattern
} = require('../index.js');

test('instance of UrlPattern is handled correctly as constructor argument', function(t) {
  const pattern = new UrlPattern('/user/:userId/task/:taskId');
  const copy = new UrlPattern(pattern);
  t.deepEqual(copy.match('/user/10/task/52'), {
    userId: '10',
    taskId: '52'
  }
  );
  t.end();
});

test('match full stops in segment values', function(t) {
  const options =
    {segmentValueCharset: 'a-zA-Z0-9-_ %.'};
  const pattern = new UrlPattern('/api/v1/user/:id/', options);
  t.deepEqual(pattern.match('/api/v1/user/test.name/'),
    {id: 'test.name'});
  t.end();
});

test('regex group names', function(t) {
  const pattern = new UrlPattern(/^\/api\/([a-zA-Z0-9-_~ %]+)(?:\/(\d+))?$/, ['resource', 'id']);
  t.deepEqual(pattern.match('/api/users'),
    {resource: 'users'});
  t.equal(pattern.match('/apiii/users'), undefined);
  t.deepEqual(pattern.match('/api/users/foo'), undefined);
  t.deepEqual(pattern.match('/api/users/10'), {
    resource: 'users',
    id: '10'
  }
  );
  t.deepEqual(pattern.match('/api/projects/10/'), undefined);
  t.end();
});
