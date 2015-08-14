UrlPattern = require '../src/url-pattern'

module.exports =

  'stringify': (test) ->
    # TODO simplify these tests with a helper function
    pattern = new UrlPattern '/foo'
    test.equal '/foo', pattern.stringify()

    # TODO regex should fail
#     pattern = new UrlPattern /foo/
#     test.deepEqual pattern.match('foo'), []


    pattern = new UrlPattern '/user/:userId/task/:taskId'
    test.equal '/user/10/task/52', pattern.stringify
      userId: '10'
      taskId: '52'

    # TODO thoroughly test the optional groups

    pattern = new UrlPattern '.user.:userId.task.:taskId'
    test.equal '.user.10.task.52', pattern.stringify
      userId: '10'
      taskId: '52'

    pattern = new UrlPattern '*/user/:userId'
    test.equal '/school/10/user/10', pattern.stringify
      _: '/school/10',
      userId: '10'

    pattern = new UrlPattern '*-user-:userId'
    test.equal '-school-10-user-10', pattern.stringify
      _: '-school-10'
      userId: '10'

    pattern = new UrlPattern '/admin*'
    test.equal '/admin/school/10/user/10', pattern.stringify
      _: '/school/10/user/10'

    pattern = new UrlPattern '/admin/*/user/*/tail'
    test.equal '/admin/school/10/user/10/12/tail', pattern.stringify
      _: ['school/10', '10/12']

    pattern = new UrlPattern '/admin/*/user/:id/*/tail'
    test.equal '/admin/school/10/user/10/12/13/tail', pattern.stringify
      _: ['school/10', '12/13']
      id: '10'

    pattern = new UrlPattern '/*/admin(/:path)'
    test.equal '/foo/admin/baz', pattern.stringify
      _: 'foo'
      path: 'baz'
    test.equal '/foo/admin', pattern.stringify
      _: 'foo'

    pattern = new UrlPattern '(/)'
    test.equal '', pattern.stringify()

    pattern = new UrlPattern '/admin(/foo)/bar'
    test.equal '/admin/bar', pattern.stringify()

    pattern = new UrlPattern '/admin(/:foo)/bar'
    test.equal '/admin/bar', pattern.stringify()
    test.equal '/admin/baz/bar', pattern.stringify
      foo: 'baz'

    pattern = new UrlPattern '/admin/(*/)foo'
    test.equal '/admin/foo', pattern.stringify()
    test.equal '/admin/baz/bar/biff/foo', pattern.stringify
      _: 'baz/bar/biff'

    pattern = new UrlPattern '/v:major.:minor/*'
    test.equal '/v1.2/resource/', pattern.stringify
      _: 'resource/'
      major: '1'
      minor: '2'

    pattern = new UrlPattern '/v:v.:v/*'
    test.equal '/v1.2/resource/', pattern.stringify
      _: 'resource/'
      v: ['1', '2']

    pattern = new UrlPattern '/:foo_bar'
    test.equal '/a_bar', pattern.stringify
      foo: 'a'
    test.equal '/a__bar', pattern.stringify
      foo: 'a_'
    test.equal '/a-b-c-d__bar', pattern.stringify
      foo: 'a-b-c-d_'
    test.equal '/a b%c-d__bar', pattern.stringify
      foo: 'a b%c-d_'

    pattern = new UrlPattern '((((a)b)c)d)'
    test.equal '', pattern.stringify()

    pattern = new UrlPattern '/user/:range'
    test.equal '/user/10-20', pattern.stringify
      range: '10-20'

# TODO throws where non-optional key is not provided
# TODO throws where group is only partially provided
# TODO optional inside optional

    test.done()
