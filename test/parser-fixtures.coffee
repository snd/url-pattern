UrlPattern = require '../src/url-pattern'
Compiler = UrlPattern.Compiler

parse = UrlPattern.U.pattern

module.exports =

  'parser correctly parses patterns': (test) ->
    test.equal parse(''), null
    test.equal parse('('), null
    test.equal parse(')'), null
    test.equal parse('()'), null
    test.equal parse(':'), null
    test.equal parse('((foo)'), null
    test.equal parse('(((foo)bar(boo)far)'), null

    test.deepEqual parse('(foo))'),
      rest: ')'
      value: [
        {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
      ]

    test.deepEqual parse('((foo)))bar'),
      rest: ')bar'
      value: [
        {
          tag: 'optional'
          value: [
            {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
          ]
        }
      ]


    test.deepEqual parse('foo:*'),
      rest: ':*'
      value: [
        {tag: 'static', value: 'foo'}
      ]

    test.deepEqual parse(':foo:bar'),
      rest: ''
      value: [
        {tag: 'named', value: 'foo'}
        {tag: 'named', value: 'bar'}
      ]

    test.deepEqual parse('a'),
      rest: ''
      value: [
        {tag: 'static', value: 'a'}
      ]
    test.deepEqual parse('user42'),
      rest: ''
      value: [
        {tag: 'static', value: 'user42'}
      ]
    test.deepEqual parse(':a'),
      rest: ''
      value: [
        {tag: 'named', value: 'a'}
      ]
    test.deepEqual parse('*'),
      rest: ''
      value: [
        {tag: 'wildcard', value: '*'}
      ]
    test.deepEqual parse('(foo)'),
      rest: ''
      value: [
        {tag: 'optional', value: [{tag: 'static', value: 'foo'}]}
      ]
    test.deepEqual parse('(:foo)'),
      rest: ''
      value: [
        {tag: 'optional', value: [{tag: 'named', value: 'foo'}]}
      ]
    test.deepEqual parse('(*)'),
      rest: ''
      value: [
        {tag: 'optional', value: [{tag: 'wildcard', value: '*'}]}
      ]


    test.deepEqual parse('/api/users/:id'),
      rest: ''
      value: [
        {tag: 'static', value: '/api/users/'}
        {tag: 'named', value: 'id'}
      ]
    test.deepEqual parse('/v:major(.:minor)/*'),
      rest: ''
      value: [
        {tag: 'static', value: '/v'}
        {tag: 'named', value: 'major'}
        {
          tag: 'optional'
          value: [
            {tag: 'static', value: '.'}
            {tag: 'named', value: 'minor'}
          ]
        }
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
      ]
    test.deepEqual parse('(http(s)\\://)(:subdomain.):domain.:tld(/*)'),
      rest: ''
      value: [
        {
          tag: 'optional'
          value: [
            {tag: 'static', value: 'http'}
            {
              tag: 'optional'
              value: [
                {tag: 'static', value: 's'}
              ]
            }
            {tag: 'static', value: '://'}
          ]
        }
        {
          tag: 'optional'
          value: [
            {tag: 'named', value: 'subdomain'}
            {tag: 'static', value: '.'}
          ]
        }
        {tag: 'named', value: 'domain'}
        {tag: 'static', value: '.'}
        {tag: 'named', value: 'tld'}
        {
          tag: 'optional'
          value: [
            {tag: 'static', value: '/'}
            {tag: 'wildcard', value: '*'}
          ]
        }
      ]
    test.deepEqual parse('/api/users/:ids/posts/:ids'),
      rest: ''
      value: [
        {tag: 'static', value: '/api/users/'}
        {tag: 'named', value: 'ids'}
        {tag: 'static', value: '/posts/'}
        {tag: 'named', value: 'ids'}
      ]

    test.deepEqual parse('/user/:userId/task/:taskId'),
      rest: ''
      value: [
        {tag: 'static', value: '/user/'}
        {tag: 'named', value: 'userId'}
        {tag: 'static', value: '/task/'}
        {tag: 'named', value: 'taskId'}
      ]

    test.deepEqual parse('.user.:userId.task.:taskId'),
      rest: ''
      value: [
        {tag: 'static', value: '.user.'}
        {tag: 'named', value: 'userId'}
        {tag: 'static', value: '.task.'}
        {tag: 'named', value: 'taskId'}
      ]

    test.deepEqual parse('*/user/:userId'),
      rest: ''
      value: [
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/user/'}
        {tag: 'named', value: 'userId'}
      ]

    test.deepEqual parse('*-user-:userId'),
      rest: ''
      value: [
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '-user-'}
        {tag: 'named', value: 'userId'}
      ]

    test.deepEqual parse('/admin*'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin'}
        {tag: 'wildcard', value: '*'}
      ]

    test.deepEqual parse('#admin*'),
      rest: ''
      value: [
        {tag: 'static', value: '#admin'}
        {tag: 'wildcard', value: '*'}
      ]

    test.deepEqual parse('/admin/*/user/:userId'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/user/'}
        {tag: 'named', value: 'userId'}
      ]

    test.deepEqual parse('$admin$*$user$:userId'),
      rest: ''
      value: [
        {tag: 'static', value: '$admin$'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '$user$'}
        {tag: 'named', value: 'userId'}
      ]

    test.deepEqual parse('/admin/*/user/*/tail'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/user/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/tail'}
      ]

    test.deepEqual parse('/admin/*/user/:id/*/tail'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/user/'}
        {tag: 'named', value: 'id'}
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/tail'}
      ]

    test.deepEqual parse('^admin^*^user^:id^*^tail'),
      rest: ''
      value: [
        {tag: 'static', value: '^admin^'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '^user^'}
        {tag: 'named', value: 'id'}
        {tag: 'static', value: '^'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '^tail'}
      ]

    test.deepEqual parse('/*/admin(/:path)'),
      rest: ''
      value: [
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
        {tag: 'static', value: '/admin'}
        {tag: 'optional', value: [
          {tag: 'static', value: '/'}
          {tag: 'named', value: 'path'}
        ]}
      ]

    test.deepEqual parse('/'),
      rest: ''
      value: [
        {tag: 'static', value: '/'}
      ]

    test.deepEqual parse('(/)'),
      rest: ''
      value: [
        {tag: 'optional', value: [
          {tag: 'static', value: '/'}
        ]}
      ]

    test.deepEqual parse('/admin(/:foo)/bar'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin'}
        {tag: 'optional', value: [
          {tag: 'static', value: '/'}
          {tag: 'named', value: 'foo'}
        ]}
        {tag: 'static', value: '/bar'}
      ]

    test.deepEqual parse('/admin(*/)foo'),
      rest: ''
      value: [
        {tag: 'static', value: '/admin'}
        {tag: 'optional', value: [
          {tag: 'wildcard', value: '*'}
          {tag: 'static', value: '/'}
        ]}
        {tag: 'static', value: 'foo'}
      ]

    test.deepEqual parse('/v:major.:minor/*'),
      rest: ''
      value: [
        {tag: 'static', value: '/v'}
        {tag: 'named', value: 'major'}
        {tag: 'static', value: '.'}
        {tag: 'named', value: 'minor'}
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
      ]

    test.deepEqual parse('/v:v.:v/*'),
      rest: ''
      value: [
        {tag: 'static', value: '/v'}
        {tag: 'named', value: 'v'}
        {tag: 'static', value: '.'}
        {tag: 'named', value: 'v'}
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
      ]

    test.deepEqual parse('/:foo_bar'),
      rest: ''
      value: [
        {tag: 'static', value: '/'}
        {tag: 'named', value: 'foo'}
        {tag: 'static', value: '_bar'}
      ]

    test.deepEqual parse('((((a)b)c)d)'),
      rest: ''
      value: [
        {tag: 'optional', value: [
          {tag: 'optional', value: [
            {tag: 'optional', value: [
              {tag: 'optional', value: [
                {tag: 'static', value: 'a'}
              ]}
              {tag: 'static', value: 'b'}
            ]}
            {tag: 'static', value: 'c'}
          ]}
          {tag: 'static', value: 'd'}
        ]}
      ]

    test.deepEqual parse('/vvv:version/*'),
      rest: ''
      value: [
        {tag: 'static', value: '/vvv'}
        {tag: 'named', value: 'version'}
        {tag: 'static', value: '/'}
        {tag: 'wildcard', value: '*'}
      ]

    test.done()
