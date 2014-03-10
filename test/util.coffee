util = require '../src/util'

module.exports =

  'getNames':

    'no names': (test) ->
      test.deepEqual [], util.getNames '/foo/bar/baz'
      test.done()

    'one name': (test) ->
      test.deepEqual ['foo'], util.getNames '/foo/:foo/bar/baz'
      test.done()

    'three names': (test) ->
      test.deepEqual ['foo', 'bar', 'baz'], util.getNames '/foo/:foo/bar/:bar/baz/:baz'
      test.done()

    'names with prefix wildcard': (test) ->
      test.deepEqual ['_', 'bar', 'baz'], util.getNames '/foo/*/bar/:bar/baz/:baz'
      test.done()

    'names with infix wildcard': (test) ->
      test.deepEqual ['foo', '_', 'baz'], util.getNames '/foo/:foo/bar/*/baz/:baz'
      test.done()

    'names with postfix wildcard': (test) ->
      test.deepEqual ['foo', 'bar', '_'], util.getNames '/foo/:foo/bar/:bar/baz/*'
      test.done()

    'name _ is disallowed': (test) ->
      test.throws ->
        util.getNames '/foo/:_'
      test.done()

    'duplicate pattern names are disallowed': (test) ->
      test.throws ->
        util.getNames '/:foo/:foo'
      test.done()

  'toRegexString':

    '^ and $ are added': (test) ->
      test.equals '^foo$', util.toRegexString 'foo'
      test.done()

    '/ are escaped': (test) ->
      test.equals '^/foo$', util.toRegexString '/foo'
      test.done()

    'names are replaced': (test) ->
      test.equals '^/users/([^/]+)/tasks/([^/]+)$',
          util.toRegexString '/users/:userId/tasks/:taskId'
      test.done()

    'wildcards are replaced': (test) ->
      test.equals '^(.*)foo$', util.toRegexString '*foo'
      test.equals '^(.*)foo(.*)$', util.toRegexString '*foo*'
      test.done()
