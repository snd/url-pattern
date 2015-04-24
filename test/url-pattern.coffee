UrlPattern = require '../src/url-pattern'

module.exports =

  'match with / separator':

    'trivial route is matched': (test) ->
      pattern = new UrlPattern '/foo'
      test.deepEqual pattern.match('/foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = new UrlPattern '/foo'
      test.equals pattern.match('/foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = new UrlPattern '/foo'
      test.equals pattern.match('/bar/foo'), null
      test.done()

    'regex without bindings is matched': (test) ->
      pattern = new UrlPattern /foo/
      test.deepEqual pattern.match('foo'), []
      test.done()

    'regex with binding is matched': (test) ->
      pattern = new UrlPattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/bar'), ['bar']
      test.done()

    'regex with empty binding is matched': (test) ->
      pattern = new UrlPattern /\/foo\/(.*)/
      test.deepEqual pattern.match('/foo/'), ['']
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = new UrlPattern '/user/:userId/task/:taskId'
      test.deepEqual pattern.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = new UrlPattern '*/user/:userId'
      test.deepEqual pattern.match('/school/10/user/10'),
        _: '/school/10',
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = new UrlPattern '/admin*'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: '/school/10/user/10'
      test.done()

    'infix wildcard': (test) ->
      pattern = new UrlPattern '/admin/*/user/:userId'
      test.deepEqual pattern.match('/admin/school/10/user/10'),
        _: 'school/10',
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = new UrlPattern '/admin/*/user/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
        _: ['school/10', '10/12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = new UrlPattern '/admin/*/user/:id/*/tail'
      test.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
        _: ['school/10', '12/13']
        id: '10'
      test.done()

    'wildcard with ambiguous trail': (test) ->
      pattern = new UrlPattern '/*/admin(/:path)'
      test.deepEqual pattern.match('/admin/admin/admin'),
        _: 'admin'
        path: 'admin'
      test.done()

    'root optional params': (test) ->
      pattern = new UrlPattern '(/)'
      test.deepEqual pattern.match(''), {}
      test.deepEqual pattern.match('/'), {}
      test.done()

    'path optional params': (test) ->
      pattern = new UrlPattern '/admin(/foo)/bar'
      test.deepEqual pattern.match('/admin/foo/bar'), {}
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with named param': (test) ->
      pattern = new UrlPattern '/admin(/:foo)/bar'
      test.deepEqual pattern.match('/admin/baz/bar'),
        foo: 'baz'
      test.deepEqual pattern.match('/admin/bar'), {}
      test.done()

    'optional params with splat': (test) ->
      pattern = new UrlPattern '/admin/(*/)foo'
      test.deepEqual pattern.match('/admin/foo'), {}
      test.deepEqual pattern.match('/admin/baz/bar/biff/foo'),
        _: 'baz/bar/biff'
      test.done()

  'match with various separators':

    'trivial route is matched': (test) ->
      pattern = new UrlPattern '.foo'
      test.deepEqual pattern.match('.foo'), {}
      test.done()

    'suffix is not matched': (test) ->
      pattern = new UrlPattern '.foo'
      test.equals pattern.match('.foobar'), null
      test.done()

    'prefix is not matched': (test) ->
      pattern = new UrlPattern '.foo'
      test.equals pattern.match('.bar.foo'), null
      test.done()

    'parameter bindings are returned': (test) ->
      pattern = new UrlPattern '.user.:userId.task.:taskId'
      test.deepEqual pattern.match('.user.10.task.52'),
        userId: '10'
        taskId: '52'
      test.done()

    'prefix wildcard': (test) ->
      pattern = new UrlPattern '*-user-:userId'
      test.deepEqual pattern.match('-school-10-user-10'),
        _: '-school-10'
        userId: '10'
      test.done()

    'suffix wildcard': (test) ->
      pattern = new UrlPattern '#admin*'
      test.deepEqual pattern.match('#admin#school#10#user#10'),
        _: '#school#10#user#10'
      test.done()

    'infix wildcard': (test) ->
      pattern = new UrlPattern '$admin$*$user$:userId'
      test.deepEqual pattern.match('$admin$school$10$user$10'),
        _: 'school$10'
        userId: '10'
      test.done()

    'multiple wildcards': (test) ->
      pattern = new UrlPattern '$admin$*$user$*$tail'
      test.deepEqual pattern.match('$admin$school$10$user$10$12$tail'),
        _: ['school$10', '10$12']
      test.done()

    'multiple wildcards and parameter binding': (test) ->
      pattern = new UrlPattern '^admin^*^user^:id^*^tail'
      test.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
        _: ['school^10', '12^13']
        id: '10'
      test.done()

    'mixed separators': (test) ->
      pattern = new UrlPattern '/v:major.:minor/*'
      test.deepEqual pattern.match('/v1.2/resource/'),
        _: 'resource/'
        major: '1'
        minor: '2'
      test.done()

    'repeated names are collected into array': (test) ->
      pattern = new UrlPattern '/v:v.:v/*'
      test.deepEqual pattern.match('/v1.2/resource/'),
        _: 'resource/'
        v: ['1', '2']
      test.done()

  'escapeForRegex': (test) ->
    test.equal 'a', UrlPattern.prototype.escapeForRegex 'a'
    test.equal '!', UrlPattern.prototype.escapeForRegex '!'
    test.equal '\\.', UrlPattern.prototype.escapeForRegex '.'
    test.equal '\\/', UrlPattern.prototype.escapeForRegex '/'
    test.equal '\\-', UrlPattern.prototype.escapeForRegex '-'
    test.equal '\\-', UrlPattern.prototype.escapeForRegex '-'
    test.equal '\\[', UrlPattern.prototype.escapeForRegex '['
    test.equal '\\]', UrlPattern.prototype.escapeForRegex ']'
    test.equal '\\(', UrlPattern.prototype.escapeForRegex '('
    test.equal '\\)', UrlPattern.prototype.escapeForRegex ')'

    test.done()

  'segment can have a constant prefix': (test) ->
    pattern = new UrlPattern '/vvv:version/*'
    test.equal null, pattern.match('/vvv/resource')
    test.deepEqual pattern.match('/vvv1/resource'),
      _: 'resource'
      version: '1'
    test.equal null, pattern.match('/vvv1.1/resource'),
    test.done()

  'self awareness': (test) ->
      pattern = new UrlPattern '/user/:userId/task/:taskId'
      copy = new UrlPattern pattern
      test.deepEqual copy.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

  'isAlphanumeric':

    'true': (test) ->
      test.ok UrlPattern.prototype.isAlphanumeric 'a'
      test.ok UrlPattern.prototype.isAlphanumeric 'z'
      test.ok UrlPattern.prototype.isAlphanumeric 'A'
      test.ok UrlPattern.prototype.isAlphanumeric 'Z'
      test.ok UrlPattern.prototype.isAlphanumeric '0'
      test.ok UrlPattern.prototype.isAlphanumeric '9'
      test.ok UrlPattern.prototype.isAlphanumeric 'adlkjf9080945lkjd'
      test.done()

    'false': (test) ->
      test.ok not UrlPattern.prototype.isAlphanumeric '.'
      test.ok not UrlPattern.prototype.isAlphanumeric '+'
      test.ok not UrlPattern.prototype.isAlphanumeric 'akld+'
      test.ok not UrlPattern.prototype.isAlphanumeric ''
      test.done()

  'compile':

    'empty string': (test) ->
      pattern = new UrlPattern ''
      test.equal pattern.regex.source, '^$'
      test.deepEqual pattern.names, []
      test.done()

    'just static alphanumeric': (test) ->
      pattern = new UrlPattern 'user42'
      test.equal pattern.regex.source, '^user42$'
      test.deepEqual pattern.names, []
      test.done()

    'just static escaped': (test) ->
      pattern = new UrlPattern '/api/v1/users'
      test.equal pattern.regex.source, '^\\/api\\/v1\\/users$'
      test.deepEqual pattern.names, []
      test.done()

    'just single char variable': (test) ->
      pattern = new UrlPattern ':a'
      test.equal pattern.regex.source, '^([a-zA-Z0-9]+)$'
      test.deepEqual pattern.names, ['a']
      test.done()

    'just variable': (test) ->
      pattern = new UrlPattern ':variable'
      test.equal pattern.regex.source, '^([a-zA-Z0-9]+)$'
      test.deepEqual pattern.names, ['variable']
      test.done()

    'just wildcard': (test) ->
      pattern = new UrlPattern '*'
      test.equal pattern.regex.source, '^(.*?)$'
      test.deepEqual pattern.names, ['_']
      test.done()

    'just wildcard': (test) ->
      pattern = new UrlPattern '*'
      test.equal pattern.regex.source, '^(.*?)$'
      test.deepEqual pattern.names, ['_']
      test.done()

    'just optional static': (test) ->
      pattern = new UrlPattern '(foo)'
      test.equal pattern.regex.source, '^(?:foo)?$'
      test.deepEqual pattern.names, []
      test.done()

    'just optional variable': (test) ->
      pattern = new UrlPattern '(:foo)'
      test.equal pattern.regex.source, '^(?:([a-zA-Z0-9]+))?$'
      test.deepEqual pattern.names, ['foo']
      test.done()

    'just optional wildcard': (test) ->
      pattern = new UrlPattern '(*)'
      test.equal pattern.regex.source, '^(?:(.*?))?$'
      test.deepEqual pattern.names, ['_']
      test.done()

    'throw on invalid variable name': (test) ->
      test.expect 2
      try
        pattern = new UrlPattern ':'
      catch e
        test.equal e.message, '`:` must be followed by at least one alphanumeric character that is the variable name'
      try
        pattern = new UrlPattern ':.'
      catch e
        test.equal e.message, '`:` must be followed by at least one alphanumeric character that is the variable name'
      test.done()

    'throw when variable directly after variable': (test) ->
      test.expect 2
      try
        pattern = new UrlPattern ':foo:bar'
      catch e
        test.equal e.message, 'cannot start variable right after variable'
      try
        pattern = new UrlPattern 'foo:foo:bar.bar'
      catch e
        test.equal e.message, 'cannot start variable right after variable'
      test.done()

    'throw when too many closing parentheses': (test) ->
      test.expect 2
      try
        pattern = new UrlPattern ')'
      catch e
        test.equal e.message, 'did not expect )'
      try
        pattern = new UrlPattern '((foo)))bar'
      catch e
        test.equal e.message, 'did not expect )'
      test.done()

    'throw when unclosed parentheses': (test) ->
      test.expect 2
      try
        pattern = new UrlPattern '('
      catch e
        test.equal e.message, 'unclosed parentheses'
      try
        pattern = new UrlPattern '(((foo)bar(boo)far)'
      catch e
        test.equal e.message, 'unclosed parentheses'
      test.done()

  'readme':

    '1': (test) ->
      pattern = new UrlPattern('/api/users/:id')
      test.deepEqual pattern.match('/api/users/10'), {id: '10'}
      test.equal pattern.match('/api/products/5'), null
      test.done()

    '2': (test) ->
      pattern = new UrlPattern('/v:major(.:minor)/*')
      test.deepEqual pattern.match('/v1.2/'), {major: '1', minor: '2', _: ''}
      test.deepEqual pattern.match('/v2/users'), {major: '2', _: 'users'}
      test.equal pattern.match('/v/'), null
      test.done()

