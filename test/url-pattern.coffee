{
  newPattern
  escapeForRegex
  getNames
  escapeSeparators
  toRegexString
} = require '../src/url-pattern'

module.exports =

  'Pattern.match with default separator /':

    'trivial route is matched': (test) ->
      pattern = newPattern '/foo'
      test.deepEqual pattern.match('/foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = newPattern '/foo'
      test.equals pattern.match('/foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = newPattern '/foo'
      test.equals pattern.match('/bar/foo'), null
      test.done()

    'regex without bindings is matched': (test) ->
      pattern = newPattern /foo/
      test.deepEqual pattern.match('foo'), []
      test.done()

    'regex with binding is matched': (test) ->
      pattern = newPattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/bar'), ['bar']
      test.done()

    'regex with empty binding is matched': (test) ->
      pattern = newPattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/'), ['']
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = newPattern '/user/:userId/task/:taskId'
      test.deepEqual pattern.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = newPattern '*/user/:userId'
      test.deepEqual pattern.match('/school/10/user/10'),
        _: ['/school/10']
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = newPattern '/admin*'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: ['/school/10/user/10']
      test.done()

    'infix wildcard': (test) ->
      pattern = newPattern '/admin/*/user/:userId'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: ['school/10']
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = newPattern '/admin/*/user/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
        _: ['school/10', '10/12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = newPattern '/admin/*/user/:id/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
        _: ['school/10', '12/13']
        id: '10'
      test.done()

    'wildcard with ambiguous trail': (test) ->
      pattern = newPattern '/*/admin(/:path)'
      test.deepEqual pattern.match('/admin/admin/admin'),
        _: ['admin']
        path: 'admin'
      test.done()

    'root optional params': (test) ->
      pattern = newPattern '(/)'
      test.deepEqual pattern.match(''), {}
      test.deepEqual pattern.match('/'), {}
      test.done()

    'path optional params': (test) ->
      pattern = newPattern '/admin(/foo)/bar'
      test.deepEqual pattern.match('/admin/foo/bar'), {}
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with named param': (test) ->
      pattern = newPattern '/admin(/:foo)/bar'
      test.deepEqual pattern.match('/admin/baz/bar'),
        foo: 'baz'
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with splat': (test) ->
      pattern = newPattern '/admin/(*/)foo'
      test.deepEqual pattern.match('/admin/foo'), {}
      test.deepEqual pattern.match('/admin/baz/bar/biff/foo'), {
        _: ['baz/bar/biff']
      }
      test.done()

  'Pattern.match with custom separators':

    'trivial route is matched': (test) ->
      pattern = newPattern '.foo', '.'
      test.deepEqual pattern.match('.foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = newPattern '.foo', '.'
      test.equals pattern.match('.foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = newPattern '.foo', '.'
      test.equals pattern.match('.bar.foo'), null
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = newPattern '.user.:userId.task.:taskId', '.'
      test.deepEqual pattern.match('.user.10.task.52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = newPattern '*-user-:userId', '#'
      test.deepEqual pattern.match('-school-10-user-10'),
        _: ['-school-10']
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = newPattern '#admin*', '#'
      test.deepEqual pattern.match('#admin#school#10#user#10'),
        _: ['#school#10#user#10']
      test.done()

    'infix wildcard': (test) ->
      pattern = newPattern '$admin$*$user$:userId', '$'
      test.deepEqual pattern.match('$admin$school$10$user$10'),
        _: ['school$10']
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = newPattern '(admin(*(user(*(tail', '('
      test.deepEqual pattern.match('(admin(school(10(user(10(12(tail'),
        _: ['school(10', '10(12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = newPattern '^admin^*^user^:id^*^tail', '^'
      test.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
        _: ['school^10', '12^13']
        id: '10'
      test.done()

  'escapeForRegex': (test) ->
    test.equal 'a', escapeForRegex 'a'
    test.equal '!', escapeForRegex '!'
    test.equal '\\.', escapeForRegex '.'
    test.equal '\\/', escapeForRegex '/'
    test.equal '\\-', escapeForRegex '-'
    test.equal '\\-', escapeForRegex '-'
    test.equal '\\[', escapeForRegex '['
    test.equal '\\]', escapeForRegex ']'
    test.equal '\\(', escapeForRegex '('
    test.equal '\\)', escapeForRegex ')'

    test.done()

  'getNames':

    'no names': (test) ->
      test.deepEqual [], getNames '/foo/bar/baz'
      test.done()

    'one name': (test) ->
      test.deepEqual ['foo'], getNames '/foo/:foo/bar/baz'
      test.done()

    'three names': (test) ->
      test.deepEqual ['foo', 'bar', 'baz'], getNames '/foo/:foo/bar/:bar/baz/:baz'
      test.done()

    'names with prefix wildcard': (test) ->
      test.deepEqual ['_', 'bar', 'baz'], getNames '/foo/*/bar/:bar/baz/:baz'
      test.done()

    'names with infix wildcard': (test) ->
      test.deepEqual ['foo', '_', 'baz'], getNames '/foo/:foo/bar/*/baz/:baz'
      test.done()

    'names with postfix wildcard': (test) ->
      test.deepEqual ['foo', 'bar', '_'], getNames '/foo/:foo/bar/:bar/baz/*'
      test.done()

    'name _ is disallowed': (test) ->
      test.throws ->
        getNames '/foo/:_'
      test.done()

    'duplicate pattern names are disallowed': (test) ->
      test.throws ->
        getNames '/:foo/:foo'
      test.done()

    'dot as custom separator': (test) ->
      test.deepEqual ['subdomain', 'domain', 'tld'],
        getNames '.:subdomain.:domain.:tld', '.'
      test.done()

    'dollar as custom separator': (test) ->
      test.deepEqual ['subdomain', 'domain', 'tld'],
        getNames '$:subdomain$:domain$:tld', '$'
      test.done()

  'toRegexString':

    '^ and $ are added': (test) ->
      test.equals '^foo$', toRegexString 'foo'
      test.done()

    '/ are escaped': (test) ->
      test.equals '^\\/foo$', toRegexString '/foo'
      test.done()

    'names are replaced': (test) ->
      test.equals '^\\/users\\/([^\\/]+)\\/tasks\\/([^\\/]+)$',
        toRegexString '/users/:userId/tasks/:taskId'
      test.done()

    'wildcards are replaced': (test) ->
      test.equals '^(.*?)foo$', toRegexString '*foo'
      test.equals '^(.*?)foo(.*?)$', toRegexString '*foo*'
      test.done()

    'dot as custom separator': (test) ->
      test.equals '^([^\\.]+)\\.example\\.([^\\.]+)$',
        toRegexString ':sub.example.:tld', '.'
      test.done()

    'dollar as custom separator': (test) ->
      test.equals '^\\$admin\\$(.*?)\\$user\\$([^\\$]+)$',
        toRegexString '$admin$*$user$:userId', '$'
      test.done()
