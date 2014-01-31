{getNames, toRegexString} = require '../src/common'
newPattern = require '../src/url-pattern'

module.exports =

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

    'toRegexString':

        '^ and $ are added': (test) ->
            test.equals '^foo$', toRegexString 'foo'
            test.done()

        '/ are escaped': (test) ->
            test.equals '^/foo$', toRegexString '/foo'
            test.done()

        'names are replaced': (test) ->
            test.equals '^/users/([^/]+)/tasks/([^/]+)$',
                toRegexString '/users/:userId/tasks/:taskId'
            test.done()

        'wildcards are replaced': (test) ->
            test.equals '^.*foo$', toRegexString '*foo'
            test.equals '^.*foo.*$', toRegexString '*foo*'
            test.done()

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
            test.deepEqual pattern.match('/user/10/task/52'), {userId: '10', taskId: '52'}
            test.done()

        'prefix wildcard works': (test) ->
            pattern = newPattern '*/user/:userId'
            test.deepEqual pattern.match('/school/10/user/10'), {userId: '10'}
            test.done()

        'suffix wildcard works': (test) ->
            pattern = newPattern '/admin*'
            test.deepEqual pattern.match('/admin/school/10/user/10'), {}
            test.done()

        'infix wildcard works': (test) ->
            pattern = newPattern '/admin/*/user/:userId'
            test.deepEqual pattern.match('/admin/school/10/user/10'), {userId: '10'}
            test.done()
