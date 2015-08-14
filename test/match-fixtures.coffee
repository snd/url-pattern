UrlPattern = require '../src/url-pattern'

module.exports =

  'match': (test) ->
    # TODO simplify these tests with a helper function
    pattern = new UrlPattern '/foo'
    test.deepEqual pattern.match('/foo'), {}

    pattern = new UrlPattern '.foo'
    test.deepEqual pattern.match('.foo'), {}

    pattern = new UrlPattern '/foo'
    test.equals pattern.match('/foobar'), null

    pattern = new UrlPattern '.foo'
    test.equals pattern.match('.foobar'), null

    pattern = new UrlPattern '/foo'
    test.equals pattern.match('/bar/foo'), null

    pattern = new UrlPattern '.foo'
    test.equals pattern.match('.bar.foo'), null

    pattern = new UrlPattern /foo/
    test.deepEqual pattern.match('foo'), []

    pattern = new UrlPattern /\/foo\/(.*)/
    test.deepEqual pattern.match('/foo/bar'), ['bar']

    pattern = new UrlPattern /\/foo\/(.*)/
    test.deepEqual pattern.match('/foo/'), ['']

    pattern = new UrlPattern '/user/:userId/task/:taskId'
    test.deepEqual pattern.match('/user/10/task/52'),
      userId: '10'
      taskId: '52'

    pattern = new UrlPattern '.user.:userId.task.:taskId'
    test.deepEqual pattern.match('.user.10.task.52'),
      userId: '10'
      taskId: '52'

    pattern = new UrlPattern '*/user/:userId'
    test.deepEqual pattern.match('/school/10/user/10'),
      _: '/school/10',
      userId: '10'

    pattern = new UrlPattern '*-user-:userId'
    test.deepEqual pattern.match('-school-10-user-10'),
      _: '-school-10'
      userId: '10'

    pattern = new UrlPattern '/admin*'
    test.deepEqual pattern.match('/admin/school/10/user/10'),
      _: '/school/10/user/10'

    pattern = new UrlPattern '#admin*'
    test.deepEqual pattern.match('#admin#school#10#user#10'),
      _: '#school#10#user#10'

    pattern = new UrlPattern '/admin/*/user/:userId'
    test.deepEqual pattern.match('/admin/school/10/user/10'),
      _: 'school/10',
      userId: '10'

    pattern = new UrlPattern '$admin$*$user$:userId'
    test.deepEqual pattern.match('$admin$school$10$user$10'),
      _: 'school$10'
      userId: '10'

    pattern = new UrlPattern '/admin/*/user/*/tail'
    test.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
      _: ['school/10', '10/12']

    pattern = new UrlPattern '$admin$*$user$*$tail'
    test.deepEqual pattern.match('$admin$school$10$user$10$12$tail'),
      _: ['school$10', '10$12']

    pattern = new UrlPattern '/admin/*/user/:id/*/tail'
    test.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
      _: ['school/10', '12/13']
      id: '10'

    pattern = new UrlPattern '^admin^*^user^:id^*^tail'
    test.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
      _: ['school^10', '12^13']
      id: '10'

    pattern = new UrlPattern '/*/admin(/:path)'
    test.deepEqual pattern.match('/admin/admin/admin'),
      _: 'admin'
      path: 'admin'

    pattern = new UrlPattern '(/)'
    test.deepEqual pattern.match(''), {}
    test.deepEqual pattern.match('/'), {}

    pattern = new UrlPattern '/admin(/foo)/bar'
    test.deepEqual pattern.match('/admin/foo/bar'), {}
    test.deepEqual pattern.match('/admin/bar'), {}

    pattern = new UrlPattern '/admin(/:foo)/bar'
    test.deepEqual pattern.match('/admin/baz/bar'),
      foo: 'baz'
    test.deepEqual pattern.match('/admin/bar'), {}

    pattern = new UrlPattern '/admin/(*/)foo'
    test.deepEqual pattern.match('/admin/foo'), {}
    test.deepEqual pattern.match('/admin/baz/bar/biff/foo'),
      _: 'baz/bar/biff'

    pattern = new UrlPattern '/v:major.:minor/*'
    test.deepEqual pattern.match('/v1.2/resource/'),
      _: 'resource/'
      major: '1'
      minor: '2'

    pattern = new UrlPattern '/v:v.:v/*'
    test.deepEqual pattern.match('/v1.2/resource/'),
      _: 'resource/'
      v: ['1', '2']

    pattern = new UrlPattern '/:foo_bar'
    test.equal pattern.match('/_bar'), null
    test.deepEqual pattern.match('/a_bar'),
      foo: 'a'
    test.deepEqual pattern.match('/a__bar'),
      foo: 'a_'
    test.deepEqual pattern.match('/a-b-c-d__bar'),
      foo: 'a-b-c-d_'
    test.deepEqual pattern.match('/a b%c-d__bar'),
      foo: 'a b%c-d_'

    pattern = new UrlPattern '((((a)b)c)d)'
    test.deepEqual pattern.match(''), {}
    test.equal pattern.match('a'), null
    test.equal pattern.match('ab'), null
    test.equal pattern.match('abc'), null
    test.deepEqual pattern.match('abcd'), {}
    test.deepEqual pattern.match('bcd'), {}
    test.deepEqual pattern.match('cd'), {}
    test.deepEqual pattern.match('d'), {}

    pattern = new UrlPattern '/user/:range'
    test.deepEqual pattern.match('/user/10-20'),
      range: '10-20'

    pattern = new UrlPattern '/user/:range'
    test.deepEqual pattern.match('/user/10_20'),
      range: '10_20'

    pattern = new UrlPattern '/user/:range'
    test.deepEqual pattern.match('/user/10 20'),
      range: '10 20'

    pattern = new UrlPattern '/user/:range'
    test.deepEqual pattern.match('/user/10%20'),
      range: '10%20'

    test.done()
