Pattern = require '../src/url-pattern'

module.exports =

  'Pattern.match with default separator /':

    'trivial route is matched': (test) ->
      pattern = new Pattern '/foo'
      test.deepEqual pattern.match('/foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = new Pattern '/foo'
      test.equals pattern.match('/foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = new Pattern '/foo'
      test.equals pattern.match('/bar/foo'), null
      test.done()

    'regex without bindings is matched': (test) ->
      pattern = new Pattern /foo/
      test.deepEqual pattern.match('foo'), []
      test.done()

    'regex with binding is matched': (test) ->
      pattern = new Pattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/bar'), ['bar']
      test.done()

    'regex with empty binding is matched': (test) ->
      pattern = new Pattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/'), ['']
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = new Pattern '/user/:userId/task/:taskId'
      test.deepEqual pattern.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = new Pattern '*/user/:userId'
      test.deepEqual pattern.match('/school/10/user/10'),
        _: ['/school/10']
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = new Pattern '/admin*'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: ['/school/10/user/10']
      test.done()

    'infix wildcard': (test) ->
      pattern = new Pattern '/admin/*/user/:userId'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: ['school/10']
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = new Pattern '/admin/*/user/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
        _: ['school/10', '10/12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = new Pattern '/admin/*/user/:id/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
        _: ['school/10', '12/13']
        id: '10'
      test.done()

    'wildcard with ambiguous trail': (test) ->
      pattern = new Pattern '/*/admin(/:path)'
      test.deepEqual pattern.match('/admin/admin/admin'),
        _: ['admin']
        path: 'admin'
      test.done()

    'root optional params': (test) ->
      pattern = new Pattern '(/)'
      test.deepEqual pattern.match(''), {}
      test.deepEqual pattern.match('/'), {}
      test.done()

    'path optional params': (test) ->
      pattern = new Pattern '/admin(/foo)/bar'
      test.deepEqual pattern.match('/admin/foo/bar'), {}
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with named param': (test) ->
      pattern = new Pattern '/admin(/:foo)/bar'
      test.deepEqual pattern.match('/admin/baz/bar'),
        foo: 'baz'
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with splat': (test) ->
      pattern = new Pattern '/admin/(*/)foo'
      test.deepEqual pattern.match('/admin/foo'), {}
      test.deepEqual pattern.match('/admin/baz/bar/biff/foo'), {
        _: ['baz/bar/biff']
      }
      test.done()

  'Pattern.match with custom separators':

    'trivial route is matched': (test) ->
      pattern = new Pattern '.foo', '.'
      test.deepEqual pattern.match('.foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = new Pattern '.foo', '.'
      test.equals pattern.match('.foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = new Pattern '.foo', '.'
      test.equals pattern.match('.bar.foo'), null
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = new Pattern '.user.:userId.task.:taskId', '.'
      test.deepEqual pattern.match('.user.10.task.52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = new Pattern '*-user-:userId', '#'
      test.deepEqual pattern.match('-school-10-user-10'),
        _: ['-school-10']
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = new Pattern '#admin*', '#'
      test.deepEqual pattern.match('#admin#school#10#user#10'),
        _: ['#school#10#user#10']
      test.done()

    'infix wildcard': (test) ->
      pattern = new Pattern '$admin$*$user$:userId', '$'
      test.deepEqual pattern.match('$admin$school$10$user$10'),
        _: ['school$10']
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = new Pattern '(admin(*(user(*(tail', '('
      test.deepEqual pattern.match('(admin(school(10(user(10(12(tail'),
        _: ['school(10', '10(12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = new Pattern '^admin^*^user^:id^*^tail', '^'
      test.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
        _: ['school^10', '12^13']
        id: '10'
      test.done()

  'escapeForRegex': (test) ->
    test.equal 'a', Pattern.prototype.escapeForRegex 'a'
    test.equal '!', Pattern.prototype.escapeForRegex '!'
    test.equal '\\.', Pattern.prototype.escapeForRegex '.'
    test.equal '\\/', Pattern.prototype.escapeForRegex '/'
    test.equal '\\-', Pattern.prototype.escapeForRegex '-'
    test.equal '\\-', Pattern.prototype.escapeForRegex '-'
    test.equal '\\[', Pattern.prototype.escapeForRegex '['
    test.equal '\\]', Pattern.prototype.escapeForRegex ']'
    test.equal '\\(', Pattern.prototype.escapeForRegex '('
    test.equal '\\)', Pattern.prototype.escapeForRegex ')'

    test.done()

  'getNames':

    'no names': (test) ->
      test.deepEqual [], Pattern.prototype.getNames '/foo/bar/baz'
      test.done()

    'one name': (test) ->
      test.deepEqual ['foo'], Pattern.prototype.getNames '/foo/:foo/bar/baz'
      test.done()

    'three names': (test) ->
      test.deepEqual ['foo', 'bar', 'baz'], Pattern.prototype.getNames '/foo/:foo/bar/:bar/baz/:baz'
      test.done()

    'names with prefix wildcard': (test) ->
      test.deepEqual ['_', 'bar', 'baz'], Pattern.prototype.getNames '/foo/*/bar/:bar/baz/:baz'
      test.done()

    'names with infix wildcard': (test) ->
      test.deepEqual ['foo', '_', 'baz'], Pattern.prototype.getNames '/foo/:foo/bar/*/baz/:baz'
      test.done()

    'names with postfix wildcard': (test) ->
      test.deepEqual ['foo', 'bar', '_'], Pattern.prototype.getNames '/foo/:foo/bar/:bar/baz/*'
      test.done()

    'name _ is disallowed': (test) ->
      test.throws ->
        Pattern.prototype.getNames '/foo/:_'
      test.done()

    'duplicate pattern names are disallowed': (test) ->
      test.throws ->
        Pattern.prototype.getNames '/:foo/:foo'
      test.done()

    'dot as custom separator': (test) ->
      test.deepEqual ['subdomain', 'domain', 'tld'],
        Pattern.prototype.getNames '.:subdomain.:domain.:tld', '.'
      test.done()

    'dollar as custom separator': (test) ->
      test.deepEqual ['subdomain', 'domain', 'tld'],
        Pattern.prototype.getNames '$:subdomain$:domain$:tld', '$'
      test.done()

  'toRegexString':

    '^ and $ are added': (test) ->
      test.equals '^foo$', Pattern.prototype.toRegexString 'foo'
      test.done()

    '/ are escaped': (test) ->
      test.equals '^\\/foo$', Pattern.prototype.toRegexString '/foo'
      test.done()

    'names are replaced': (test) ->
      test.equals '^\\/users\\/([^\\/]+)\\/tasks\\/([^\\/]+)$',
        Pattern.prototype.toRegexString '/users/:userId/tasks/:taskId'
      test.done()

    'wildcards are replaced': (test) ->
      test.equals '^(.*?)foo$', Pattern.prototype.toRegexString '*foo'
      test.equals '^(.*?)foo(.*?)$', Pattern.prototype.toRegexString '*foo*'
      test.done()

    'dot as custom separator': (test) ->
      test.equals '^([^\\.]+)\\.example\\.([^\\.]+)$',
        Pattern.prototype.toRegexString ':sub.example.:tld', '.'
      test.done()

    'dollar as custom separator': (test) ->
      test.equals '^\\$admin\\$(.*?)\\$user\\$([^\\$]+)$',
        Pattern.prototype.toRegexString '$admin$*$user$:userId', '$'
      test.done()

  'segment can have a constant prefix': (test) ->
    pattern = new Pattern '/vvv:version/*'
    test.ok null is pattern.match('/vvv/resource')
    test.deepEqual pattern.match('/vvv1/resource'),
      _: ['resource']
      version: '1'
    test.deepEqual pattern.match('/vvv1.1/resource'),
      _: ['resource']
      version: '1.1'
    test.done()
