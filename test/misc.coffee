UrlPattern = require '../lib/url-pattern'

module.exports =

  'instance of UrlPattern is handled correctly as constructor argument': (test) ->
      pattern = new UrlPattern '/user/:userId/task/:taskId'
      copy = new UrlPattern pattern
      test.deepEqual copy.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

  'match full stops in segment values': (test) ->
      options =
        segmentValueCharset: 'a-zA-Z0-9-_ %.'
      pattern = new UrlPattern '/api/v1/user/:id/', options
      test.deepEqual pattern.match('/api/v1/user/test.name/'),
        id: 'test.name'
      test.done()

  'regex group names': (test) ->
    pattern = new UrlPattern /^\/api\/([a-zA-Z0-9-_~ %]+)(?:\/(\d+))?$/, ['resource', 'id']
    test.deepEqual pattern.match('/api/users'),
      resource: 'users'
    test.equal pattern.match('/apiii/users'), null
    test.deepEqual pattern.match('/api/users/foo'), null
    test.deepEqual pattern.match('/api/users/10'),
      resource: 'users'
      id: '10'
    test.deepEqual pattern.match('/api/projects/10/'), null
    test.done()
