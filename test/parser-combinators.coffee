UrlPattern = require '../src/url-pattern'

P = UrlPattern.P
U = UrlPattern.U

module.exports =

  'nothing': (test) ->
      test.deepEqual P.nothing(''),
        value: null
        rest: ''
      test.deepEqual P.nothing('foobar'),
        value: null
        rest: 'foobar'
      test.done()

  'anyChar': (test) ->
      test.deepEqual P.anyChar('foobar'),
        value: 'f'
        rest: 'oobar'
      test.deepEqual P.anyChar('foo'),
        value: 'f'
        rest: 'oo'
      test.equal P.anyChar(''), null
      test.done()

  'string': (test) ->
      parser = P.string('foo')
      test.deepEqual parser('foobar'),
        value: 'foo'
        rest: 'bar'
      test.deepEqual parser('foo'),
        value: 'foo'
        rest: ''
      test.equal parser('bar'), null
      test.equal parser(''), null
      test.done()

  'charset': (test) ->
      parser = P.charset('a-zA-Z0-9-_ %')
      test.deepEqual parser('foobar'),
        value: 'f'
        rest: 'oobar'
      test.deepEqual parser('_aa'),
        value: '_'
        rest: 'aa'
      test.deepEqual parser('a'),
        value: 'a'
        rest: ''
      test.equal parser('$foobar'), null
      test.equal parser('$'), null
      test.equal parser(''), null
      test.done()

  'concatMany1 charset': (test) ->
    parser = P.concatMany1(P.charset('a-zA-Z0-9-_ %'))
    test.deepEqual parser('foobar'),
      value: 'foobar'
      rest: ''
    test.deepEqual parser('f%_.bar'),
      value: 'f%_'
      rest: '.bar'
    test.deepEqual parser('f@bar'),
      value: 'f'
      rest: '@bar'
    test.equal parser('@bar'), null
    test.deepEqual parser('-'),
      value: '-'
      rest: ''
    test.equal parser(''), null
    test.equal parser('$aa'), null
    test.done()

  'between': (test) ->
      parser = P.between(
        P.string('(')
        P.concatMany1(P.charset('0-9'))
        P.string(')')
      )
      test.deepEqual parser('(100)'),
        value: '100'
        rest: ''
      test.deepEqual parser('(100)200'),
        value: '100'
        rest: '200'
      test.deepEqual parser('(1)()'),
        value: '1'
        rest: '()'
      test.equal parser('()'), null
      test.equal parser('foo(100)'), null
      test.equal parser('(100foo)'), null
      test.equal parser('(foo100)'), null
      test.equal parser('(foobar)'), null
      test.equal parser('foobar'), null
      test.equal parser('_aa'), null
      test.equal parser('$foobar'), null
      test.equal parser('$'), null
      test.equal parser(''), null
      test.done()

  'wildcard': (test) ->
      test.deepEqual U.wildcard('*'),
        value:
          tag: 'wildcard'
          value: '*'
        rest: ''
      test.deepEqual U.wildcard('*/'),
        value:
          tag: 'wildcard'
          value: '*'
        rest: '/'
      test.equal U.wildcard(' *'), null
      test.equal U.wildcard('()'), null
      test.equal U.wildcard('foo(100)'), null
      test.equal U.wildcard('(100foo)'), null
      test.equal U.wildcard('(foo100)'), null
      test.equal U.wildcard('(foobar)'), null
      test.equal U.wildcard('foobar'), null
      test.equal U.wildcard('_aa'), null
      test.equal U.wildcard('$foobar'), null
      test.equal U.wildcard('$'), null
      test.equal U.wildcard(''), null
      test.done()

  'named': (test) ->
      test.deepEqual U.named(':a'),
        value:
          tag: 'named'
          value: 'a'
        rest: ''
      test.deepEqual U.named(':ab96c'),
        value:
          tag: 'named'
          value: 'ab96c'
        rest: ''
      test.deepEqual U.named(':ab96c.'),
        value:
          tag: 'named'
          value: 'ab96c'
        rest: '.'
      test.deepEqual U.named(':96c-:ab'),
        value:
          tag: 'named'
          value: '96c'
        rest: '-:ab'
      test.equal U.named(':'), null
      test.equal U.named(''), null
      test.equal U.named('a'), null
      test.equal U.named('abc'), null
      test.done()

  'static': (test) ->
      test.deepEqual U.static('a'),
        value:
          tag: 'static'
          value: 'a'
        rest: ''
      test.deepEqual U.static('abc:d'),
        value:
          tag: 'static'
          value: 'abc'
        rest: ':d'
      test.equal U.static(':ab96c'), null
      test.equal U.static(':'), null
      test.equal U.static('('), null
      test.equal U.static(')'), null
      test.equal U.static('*'), null
      test.equal U.static(''), null
      test.done()
