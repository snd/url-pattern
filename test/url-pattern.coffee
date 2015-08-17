UrlPattern = require '../src/url-pattern'

module.exports =

    'default': (test) ->
      pattern = new UrlPattern '(http(s)\\://)(:sub.):domain.:tld(/*)'

      test.deepEqual pattern.match('google.de'),
        domain: 'google'
        tld: 'de'
      test.deepEqual pattern.match('http://mail.google.com/mail'),
        sub: 'mail'
        domain: 'google'
        tld: 'com'
        _: 'mail'
      test.equal pattern.match('google'), null
      test.deepEqual pattern.match('www.google.com'),
        sub: 'www'
        domain: 'google'
        tld: 'com'
      test.deepEqual pattern.match('https://www.google.com'),
        sub: 'www'
        domain: 'google'
        tld: 'com'
      test.equal pattern.match('httpp://mail.google.com/mail'), null
      test.deepEqual pattern.match('google.de/search'),
        domain: 'google'
        tld: 'de'
        _: 'search'
      test.done()

  'named segment can have a static prefix': (test) ->
    pattern = new UrlPattern '/vvv:version/*'
    test.equal null, pattern.match('/vvv/resource')
    test.deepEqual pattern.match('/vvv1/resource'),
      _: 'resource'
      version: '1'
    test.equal null, pattern.match('/vvv1.1/resource'),
    test.done()

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

  'regex names': (test) ->
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
