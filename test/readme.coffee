UrlPattern = require '../src/url-pattern'

module.exports =

  'simple': (test) ->
    pattern = new UrlPattern('/api/users/:id')
    test.deepEqual pattern.match('/api/users/10'), {id: '10'}
    test.equal pattern.match('/api/products/5'), null
    test.done()

  'api versioning': (test) ->
    pattern = new UrlPattern('/v:major(.:minor)/*')
    test.deepEqual pattern.match('/v1.2/'), {major: '1', minor: '2', _: ''}
    test.deepEqual pattern.match('/v2/users'), {major: '2', _: 'users'}
    test.equal pattern.match('/v/'), null
    test.done()

  'domain': (test) ->
    pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(/*)')
    test.deepEqual pattern.match('google.de'),
      domain: 'google'
      tld: 'de'
    test.deepEqual pattern.match('https://www.google.com'),
      subdomain: 'www'
      domain: 'google'
      tld: 'com'
    test.deepEqual pattern.match('http://mail.google.com/mail'),
      subdomain: 'mail'
      domain: 'google'
      tld: 'com'
      _: 'mail'
    test.equal pattern.match('google'), null

    test.deepEqual pattern.match('www.google.com'),
      subdomain: 'www'
      domain: 'google'
      tld: 'com'
    test.equal pattern.match('httpp://mail.google.com/mail'), null
    test.deepEqual pattern.match('google.de/search'),
      domain: 'google'
      tld: 'de'
      _: 'search'

    test.done()

  'named segment occurs more than once': (test) ->
    pattern = new UrlPattern('/api/users/:ids/posts/:ids')
    test.deepEqual pattern.match('/api/users/10/posts/5'), {ids: ['10', '5']}
    test.done()

  'regex': (test) ->
    pattern = new UrlPattern(/^\/api\/(.*)$/)
    test.deepEqual pattern.match('/api/users'), ['users']
    test.equal pattern.match('/apiii/users'), null
    test.done()

  'regex group names': (test) ->
    pattern = new UrlPattern(/^\/api\/([^\/]+)(?:\/(\d+))?$/, ['resource', 'id'])
    test.deepEqual pattern.match('/api/users'),
      resource: 'users'
    test.equal pattern.match('/api/users/'), null
    test.deepEqual pattern.match('/api/users/5'),
      resource: 'users'
      id: '5'
    test.equal pattern.match('/api/users/foo'), null
    test.done()

  'stringify': (test) ->
    pattern = new UrlPattern('/api/users/:id')
    test.equal '/api/users/10', pattern.stringify(id: 10)

    pattern = new UrlPattern('/api/users(/:id)')
    test.equal '/api/users', pattern.stringify()
    test.equal '/api/users/10', pattern.stringify(id: 10)

    test.done()

  'customization': (test) ->
    options =
      escapeChar: '!'
      segmentNameStartChar: '$'
      segmentNameCharset: 'a-zA-Z0-9_-'
      segmentValueCharset: 'a-zA-Z0-9'
      optionalSegmentStartChar: '['
      optionalSegmentEndChar: ']'
      wildcardChar: '?'

    pattern = new UrlPattern(
      '[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]'
      options
    )

    test.deepEqual pattern.match('google.de'),
      domain: 'google'
      'toplevel-domain': 'de'
    test.deepEqual pattern.match('http://mail.google.com/mail'),
      sub_domain: 'mail'
      domain: 'google'
      'toplevel-domain': 'com'
      _: 'mail'
    test.equal pattern.match('http://mail.this-should-not-match.com/mail'), null
    test.equal pattern.match('google'), null
    test.deepEqual pattern.match('www.google.com'),
      sub_domain: 'www'
      domain: 'google'
      'toplevel-domain': 'com'
    test.deepEqual pattern.match('https://www.google.com'),
      sub_domain: 'www'
      domain: 'google'
      'toplevel-domain': 'com'
    test.equal pattern.match('httpp://mail.google.com/mail'), null
    test.deepEqual pattern.match('google.de/search'),
      domain: 'google'
      'toplevel-domain': 'de'
      _: 'search'
    test.done()
