newPattern = require '../src/url-pattern'

module.exports =

  'Pattern.match':

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
