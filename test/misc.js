const test = require('tape')
const UrlPattern = require('../lib/url-pattern')

test('instance of UrlPattern is handled correctly as constructor argument', function(t) {
  const pattern = new UrlPattern('/user/:userId/task/:taskId')
  const copy = new UrlPattern(pattern)
  t.deepEqual(copy.match('/user/10/task/52'), {
    userId: '10',
    taskId: '52'
  })
  return t.end()
})

test('match full stops in segment values', function(t) {
  const options = {segmentValueCharset: 'a-zA-Z0-9-_ %.'}
  const pattern = new UrlPattern('/api/v1/user/:id/', options)
  t.deepEqual(pattern.match('/api/v1/user/test.name/'), {id: 'test.name'})
  return t.end()
})

test('regex group names', function(t) {
  const pattern = new UrlPattern(/^\/api\/([a-zA-Z0-9-_~ %]+)(?:\/(\d+))?$/, [
    'resource',
    'id'
  ])
  t.deepEqual(pattern.match('/api/users'), {resource: 'users'})
  t.equal(pattern.match('/apiii/users'), null)
  t.deepEqual(pattern.match('/api/users/foo'), null)
  t.deepEqual(pattern.match('/api/users/10'), {
    resource: 'users',
    id: '10'
  })
  t.deepEqual(pattern.match('/api/projects/10/'), null)
  return t.end()
})
