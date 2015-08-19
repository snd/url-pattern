test = require 'tape'
UrlPattern = require '../lib/url-pattern'

test 'match', (t) ->
  pattern = new UrlPattern '/foo'
  t.deepEqual pattern.match('/foo'), {}

  pattern = new UrlPattern '.foo'
  t.deepEqual pattern.match('.foo'), {}

  pattern = new UrlPattern '/foo'
  t.equals pattern.match('/foobar'), null

  pattern = new UrlPattern '.foo'
  t.equals pattern.match('.foobar'), null

  pattern = new UrlPattern '/foo'
  t.equals pattern.match('/bar/foo'), null

  pattern = new UrlPattern '.foo'
  t.equals pattern.match('.bar.foo'), null

  pattern = new UrlPattern /foo/
  t.deepEqual pattern.match('foo'), []

  pattern = new UrlPattern /\/foo\/(.*)/
  t.deepEqual pattern.match('/foo/bar'), ['bar']

  pattern = new UrlPattern /\/foo\/(.*)/
  t.deepEqual pattern.match('/foo/'), ['']

  pattern = new UrlPattern '/user/:userId/task/:taskId'
  t.deepEqual pattern.match('/user/10/task/52'),
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '.user.:userId.task.:taskId'
  t.deepEqual pattern.match('.user.10.task.52'),
    userId: '10'
    taskId: '52'

  pattern = new UrlPattern '*/user/:userId'
  t.deepEqual pattern.match('/school/10/user/10'),
    _: '/school/10',
    userId: '10'

  pattern = new UrlPattern '*-user-:userId'
  t.deepEqual pattern.match('-school-10-user-10'),
    _: '-school-10'
    userId: '10'

  pattern = new UrlPattern '/admin*'
  t.deepEqual pattern.match('/admin/school/10/user/10'),
    _: '/school/10/user/10'

  pattern = new UrlPattern '#admin*'
  t.deepEqual pattern.match('#admin#school#10#user#10'),
    _: '#school#10#user#10'

  pattern = new UrlPattern '/admin/*/user/:userId'
  t.deepEqual pattern.match('/admin/school/10/user/10'),
    _: 'school/10',
    userId: '10'

  pattern = new UrlPattern '$admin$*$user$:userId'
  t.deepEqual pattern.match('$admin$school$10$user$10'),
    _: 'school$10'
    userId: '10'

  pattern = new UrlPattern '/admin/*/user/*/tail'
  t.deepEqual pattern.match('/admin/school/10/user/10/12/tail'),
    _: ['school/10', '10/12']

  pattern = new UrlPattern '$admin$*$user$*$tail'
  t.deepEqual pattern.match('$admin$school$10$user$10$12$tail'),
    _: ['school$10', '10$12']

  pattern = new UrlPattern '/admin/*/user/:id/*/tail'
  t.deepEqual pattern.match('/admin/school/10/user/10/12/13/tail'),
    _: ['school/10', '12/13']
    id: '10'

  pattern = new UrlPattern '^admin^*^user^:id^*^tail'
  t.deepEqual pattern.match('^admin^school^10^user^10^12^13^tail'),
    _: ['school^10', '12^13']
    id: '10'

  pattern = new UrlPattern '/*/admin(/:path)'
  t.deepEqual pattern.match('/admin/admin/admin'),
    _: 'admin'
    path: 'admin'

  pattern = new UrlPattern '(/)'
  t.deepEqual pattern.match(''), {}
  t.deepEqual pattern.match('/'), {}

  pattern = new UrlPattern '/admin(/foo)/bar'
  t.deepEqual pattern.match('/admin/foo/bar'), {}
  t.deepEqual pattern.match('/admin/bar'), {}

  pattern = new UrlPattern '/admin(/:foo)/bar'
  t.deepEqual pattern.match('/admin/baz/bar'),
    foo: 'baz'
  t.deepEqual pattern.match('/admin/bar'), {}

  pattern = new UrlPattern '/admin/(*/)foo'
  t.deepEqual pattern.match('/admin/foo'), {}
  t.deepEqual pattern.match('/admin/baz/bar/biff/foo'),
    _: 'baz/bar/biff'

  pattern = new UrlPattern '/v:major.:minor/*'
  t.deepEqual pattern.match('/v1.2/resource/'),
    _: 'resource/'
    major: '1'
    minor: '2'

  pattern = new UrlPattern '/v:v.:v/*'
  t.deepEqual pattern.match('/v1.2/resource/'),
    _: 'resource/'
    v: ['1', '2']

  pattern = new UrlPattern '/:foo_bar'
  t.equal pattern.match('/_bar'), null
  t.deepEqual pattern.match('/a_bar'),
    foo: 'a'
  t.deepEqual pattern.match('/a__bar'),
    foo: 'a_'
  t.deepEqual pattern.match('/a-b-c-d__bar'),
    foo: 'a-b-c-d_'
  t.deepEqual pattern.match('/a b%c-d__bar'),
    foo: 'a b%c-d_'

  pattern = new UrlPattern '((((a)b)c)d)'
  t.deepEqual pattern.match(''), {}
  t.equal pattern.match('a'), null
  t.equal pattern.match('ab'), null
  t.equal pattern.match('abc'), null
  t.deepEqual pattern.match('abcd'), {}
  t.deepEqual pattern.match('bcd'), {}
  t.deepEqual pattern.match('cd'), {}
  t.deepEqual pattern.match('d'), {}

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10-20'),
    range: '10-20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10_20'),
    range: '10_20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10 20'),
    range: '10 20'

  pattern = new UrlPattern '/user/:range'
  t.deepEqual pattern.match('/user/10%20'),
    range: '10%20'

  pattern = new UrlPattern '/vvv:version/*'
  t.equal null, pattern.match('/vvv/resource')
  t.deepEqual pattern.match('/vvv1/resource'),
    _: 'resource'
    version: '1'
  t.equal null, pattern.match('/vvv1.1/resource'),

  t.end()
