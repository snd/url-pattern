UrlPattern = require '../lib/url-pattern'

{
  astNodeToRegexString
  astNodeToNames
  getParam
} = UrlPattern

parse = UrlPattern.newParser(UrlPattern.defaultOptions).pattern

module.exports =
  'astNodeToRegexString and astNodeToNames':

    'just static alphanumeric': (test) ->
      parsed = parse 'user42'
      test.equal astNodeToRegexString(parsed.value), '^user42$'
      test.deepEqual astNodeToNames(parsed.value), []
      test.done()

    'just static escaped': (test) ->
      parsed = parse '/api/v1/users'
      test.equal astNodeToRegexString(parsed.value), '^\\/api\\/v1\\/users$'
      test.deepEqual astNodeToNames(parsed.value), []
      test.done()

    'just single char variable': (test) ->
      parsed = parse ':a'
      test.equal astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
      test.deepEqual astNodeToNames(parsed.value), ['a']
      test.done()

    'just variable': (test) ->
      parsed = parse ':variable'
      test.equal astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
      test.deepEqual astNodeToNames(parsed.value), ['variable']
      test.done()

    'just wildcard': (test) ->
      parsed = parse '*'
      test.equal astNodeToRegexString(parsed.value), '^(.*?)$'
      test.deepEqual astNodeToNames(parsed.value), ['_']
      test.done()

    'just optional static': (test) ->
      parsed = parse '(foo)'
      test.equal astNodeToRegexString(parsed.value), '^(?:foo)?$'
      test.deepEqual astNodeToNames(parsed.value), []
      test.done()

    'just optional variable': (test) ->
      parsed = parse '(:foo)'
      test.equal astNodeToRegexString(parsed.value), '^(?:([a-zA-Z0-9-_~ %]+))?$'
      test.deepEqual astNodeToNames(parsed.value), ['foo']
      test.done()

    'just optional wildcard': (test) ->
      parsed = parse '(*)'
      test.equal astNodeToRegexString(parsed.value), '^(?:(.*?))?$'
      test.deepEqual astNodeToNames(parsed.value), ['_']
      test.done()

    'getParam':

      'no side effects': (test) ->
        next = {}
        test.equal null, getParam {}, 'one', next
        test.deepEqual next, {}

        # value

        next = {}
        test.equal 1, getParam {one: 1}, 'one', next
        test.deepEqual next, {}

        next = {one: 0}
        test.equal 1, getParam {one: 1}, 'one', next
        test.deepEqual next, {one: 0}

        next = {one: 1}
        test.equal null, getParam {one: 1}, 'one', next
        test.deepEqual next, {one: 1}

        next = {one: 2}
        test.equal null, getParam {one: 1}, 'one', next
        test.deepEqual next, {one: 2}

        # array

        next = {}
        test.equal 1, getParam {one: [1]}, 'one', next
        test.deepEqual next, {}

        next = {one: 0}
        test.equal 1, getParam {one: [1]}, 'one', next
        test.deepEqual next, {one: 0}

        next = {one: 1}
        test.equal null, getParam {one: [1]}, 'one', next
        test.deepEqual next, {one: 1}

        next = {one: 2}
        test.equal null, getParam {one: [1]}, 'one', next
        test.deepEqual next, {one: 2}

        next = {one: 0}
        test.equal 1, getParam {one: [1, 2, 3]}, 'one', next
        test.deepEqual next, {one: 0}

        next = {one: 1}
        test.equal 2, getParam {one: [1, 2, 3]}, 'one', next
        test.deepEqual next, {one: 1}

        next = {one: 2}
        test.equal 3, getParam {one: [1, 2, 3]}, 'one', next
        test.deepEqual next, {one: 2}

        next = {one: 3}
        test.equal null, getParam {one: [1, 2, 3]}, 'one', next
        test.deepEqual next, {one: 3}

        test.done()

      'side effects': (test) ->
        next = {}
        test.equal 1, getParam {one: 1}, 'one', next, true
        test.deepEqual next, {one: 1}

        next = {one: 0}
        test.equal 1, getParam {one: 1}, 'one', next, true
        test.deepEqual next, {one: 1}

        # array

        next = {}
        test.equal 1, getParam {one: [1]}, 'one', next, true
        test.deepEqual next, {one: 1}

        next = {one: 0}
        test.equal 1, getParam {one: [1]}, 'one', next, true
        test.deepEqual next, {one: 1}

        next = {one: 0}
        test.equal 1, getParam {one: [1, 2, 3]}, 'one', next, true
        test.deepEqual next, {one: 1}

        next = {one: 1}
        test.equal 2, getParam {one: [1, 2, 3]}, 'one', next, true
        test.deepEqual next, {one: 2}

        next = {one: 2}
        test.equal 3, getParam {one: [1, 2, 3]}, 'one', next, true
        test.deepEqual next, {one: 3}

        test.done()

      'side effects errors': (test) ->
        test.expect 2 * 6

        next = {}
        try
          getParam {}, 'one', next, true
        catch e
          test.equal e.message, "no values provided for key `one`"
        test.deepEqual next, {}

        next = {one: 1}
        try
          getParam {one: 1}, 'one', next, true
        catch e
          test.equal e.message, "too few values provided for key `one`"
        test.deepEqual next, {one: 1}

        next = {one: 2}
        try
          getParam {one: 2}, 'one', next, true
        catch e
          test.equal e.message, "too few values provided for key `one`"
        test.deepEqual next, {one: 2}

        next = {one: 1}
        try
          getParam {one: [1]}, 'one', next, true
        catch e
          test.equal e.message, "too few values provided for key `one`"
        test.deepEqual next, {one: 1}

        next = {one: 2}
        try
          getParam {one: [1]}, 'one', next, true
        catch e
          test.equal e.message, "too few values provided for key `one`"
        test.deepEqual next, {one: 2}

        next = {one: 3}
        try
          getParam {one: [1, 2, 3]}, 'one', next, true
        catch e
          test.equal e.message, "too few values provided for key `one`"
        test.deepEqual next, {one: 3}

        test.done()
