UrlPattern = require '../src/url-pattern'

module.exports =

  'astNodeToRegexString and astNodeToNames produce correct results':

    'just static alphanumeric': (test) ->
      parsed = UrlPattern.U.pattern 'user42'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^user42$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), []
      test.done()

    'just static escaped': (test) ->
      parsed = UrlPattern.U.pattern '/api/v1/users'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^\\/api\\/v1\\/users$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), []
      test.done()

    'just single char variable': (test) ->
      parsed = UrlPattern.U.pattern ':a'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['a']
      test.done()

    'just variable': (test) ->
      parsed = UrlPattern.U.pattern ':variable'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['variable']
      test.done()

    'just wildcard': (test) ->
      parsed = UrlPattern.U.pattern '*'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^(.*?)$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['_']
      test.done()

    'just optional static': (test) ->
      parsed = UrlPattern.U.pattern '(foo)'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^(?:foo)?$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), []
      test.done()

    'just optional variable': (test) ->
      parsed = UrlPattern.U.pattern '(:foo)'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^(?:([a-zA-Z0-9-_~ %]+))?$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['foo']
      test.done()

    'just optional wildcard': (test) ->
      parsed = UrlPattern.U.pattern '(*)'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^(?:(.*?))?$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['_']
      test.done()
