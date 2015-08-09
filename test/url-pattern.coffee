UrlPattern = require '../src/url-pattern'
Compiler = UrlPattern.Compiler

module.exports =

  'examples in README.md':

    'simple': (test) ->
      pattern = new UrlPattern('/api/users/:id')
      test.deepEqual pattern.match('/api/users/10'), {id: '10'}
      test.equal pattern.match('/api/products/5'), null
      test.done()

    'api versioning': (test) ->
      pattern = new UrlPattern('/v:major(.:minor)/*')
      test.deepEqual pattern.match('/v1.2/'), {major: '1', minor: '2', _: ''}
      test.deepEqual pattern.match('/v2/users'), {major: '2', _: 'users'}
      test.equal pattern.match('/v/'), null
      test.done()

    'domain': (test) ->
      pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(/*)')
      test.deepEqual pattern.match('google.de'),
        domain: 'google'
        tld: 'de'
      test.deepEqual pattern.match('https://www.google.com'),
        subdomain: 'www'
        domain: 'google'
        tld: 'com'
      test.deepEqual pattern.match('http://mail.google.com/mail'),
        subdomain: 'mail'
        domain: 'google'
        tld: 'com'
        _: 'mail'
      test.equal pattern.match('google'), null

      test.deepEqual pattern.match('www.google.com'),
        subdomain: 'www'
        domain: 'google'
        tld: 'com'
      test.equal pattern.match('httpp://mail.google.com/mail'), null
      test.deepEqual pattern.match('google.de/search'),
        domain: 'google'
        tld: 'de'
        _: 'search'

      test.done()

    'named segment occurs more than once': (test) ->
      pattern = new UrlPattern('/api/users/:ids/posts/:ids')
      test.deepEqual pattern.match('/api/users/10/posts/5'), {ids: ['10', '5']}
      test.done()

    'regex': (test) ->
      pattern = new UrlPattern(/\/api\/(.*)/)
      test.deepEqual pattern.match('/api/users'), ['users']
      test.equal pattern.match('/apiii/users'), null
      test.done()

#     'modifying the compiler': (test) ->
#       compiler = new UrlPattern.Compiler()
#       compiler.escapeChar = '!'
#       compiler.segmentNameStartChar = '$'
#       compiler.segmentNameCharset = 'a-zA-Z0-9_-'
#       compiler.segmentValueCharset = 'a-zA-Z0-9'
#       compiler.optionalSegmentStartChar = '['
#       compiler.optionalSegmentEndChar = ']'
#       compiler.wildcardChar = '?'
#
#       pattern = new UrlPattern(
#         '[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]'
#         compiler
#       )
#
#       test.deepEqual pattern.match('google.de'),
#         domain: 'google'
#         'toplevel-domain': 'de'
#       test.deepEqual pattern.match('http://mail.google.com/mail'),
#         sub_domain: 'mail'
#         domain: 'google'
#         'toplevel-domain': 'com'
#         _: 'mail'
#       test.equal pattern.match('http://mail.this-should-not-match.com/mail'), null
#       test.equal pattern.match('google'), null
#       test.deepEqual pattern.match('www.google.com'),
#         sub_domain: 'www'
#         domain: 'google'
#         'toplevel-domain': 'com'
#       test.deepEqual pattern.match('https://www.google.com'),
#         sub_domain: 'www'
#         domain: 'google'
#         'toplevel-domain': 'com'
#       test.equal pattern.match('httpp://mail.google.com/mail'), null
#       test.deepEqual pattern.match('google.de/search'),
#         domain: 'google'
#         'toplevel-domain': 'de'
#         _: 'search'
#       test.done()

  'helpers':

    'UrlPattern.escapeForRegex()': (test) ->
      test.equal 'a', UrlPattern.escapeForRegex 'a'
      test.equal '!', UrlPattern.escapeForRegex '!'
      test.equal '\\.', UrlPattern.escapeForRegex '.'
      test.equal '\\/', UrlPattern.escapeForRegex '/'
      test.equal '\\-', UrlPattern.escapeForRegex '-'
      test.equal '\\-', UrlPattern.escapeForRegex '-'
      test.equal '\\[', UrlPattern.escapeForRegex '['
      test.equal '\\]', UrlPattern.escapeForRegex ']'
      test.equal '\\(', UrlPattern.escapeForRegex '('
      test.equal '\\)', UrlPattern.escapeForRegex ')'
      test.done()

  'astNodeToRegexString and astNodeToNames produce correct results':

    # TODO empty string is no longer a valid pattern
    # 'empty string': (test) ->
    #   ast = UrlPattern.U.pattern ''
    #   test.equal UrlPattern.astNodeToRegexString(ast), '^$'
    #   test.deepEqual UrlPattern.astNodeToNames(ast), []
    #   test.done()

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

    # 'just single char variable': (test) ->
    #   compiler.compile ':a'
    #   test.equal compiler.regexString, '^' + Compiler.prototype.segmentValueRegexString() + '$'
    #   test.deepEqual compiler.names, ['a']
    #   test.done()

#     'just variable': (test) ->
#       compiler = new Compiler
#       compiler.compile ':variable'
#       test.equal compiler.regexString, '^' + Compiler.prototype.segmentValueRegexString() + '$'
#       test.deepEqual compiler.names, ['variable']
#       test.done()
#
#     'just wildcard': (test) ->
#       compiler = new Compiler
#       compiler.compile '*'
#       test.equal compiler.regexString, '^(.*?)$'
#       test.deepEqual compiler.names, ['_']
#       test.done()
#
#     'just wildcard': (test) ->
#       compiler = new Compiler
#       compiler.compile '*'
#       test.equal compiler.regexString, '^(.*?)$'
#       test.deepEqual compiler.names, ['_']
#       test.done()
#
#     'just optional static': (test) ->
#       compiler = new Compiler
#       compiler.compile '(foo)'
#       test.equal compiler.regexString, '^(?:foo)?$'
#       test.deepEqual compiler.names, []
#       test.done()
#
#     'just optional variable': (test) ->
#       compiler = new Compiler
#       compiler.compile '(:foo)'
#       test.equal compiler.regexString, '^(?:' + Compiler.prototype.segmentValueRegexString() + ')?$'
#       test.deepEqual compiler.names, ['foo']
#       test.done()
#
#     'just optional wildcard': (test) ->
#       compiler = new Compiler
#       compiler.compile '(*)'
#       test.equal compiler.regexString, '^(?:(.*?))?$'
#       test.deepEqual compiler.names, ['_']
#       test.done()

#     'throw':
#
#       'invalid variable name': (test) ->
#         test.expect 3
#         try
#           compiler = new Compiler
#           compiler.compile ':'
#         catch e
#           test.equal e.message, "`:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 1"
#         try
#           compiler = new Compiler
#           compiler.compile ':.'
#         catch e
#           test.equal e.message, "`:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 1"
#         try
#           compiler = new Compiler
#           compiler.compile 'foo:.'
#         catch e
#           test.equal e.message, "`:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 4"
#         test.done()
#
#       'variable directly after variable': (test) ->
#         test.expect 2
#         try
#           compiler = new Compiler
#           compiler.compile ':foo:bar'
#         catch e
#           test.equal e.message, 'cannot start named segment right after named segment at 4'
#         try
#           compiler = new Compiler
#           compiler.compile 'foo:foo:bar.bar'
#         catch e
#           test.equal e.message, 'cannot start named segment right after named segment at 7'
#         test.done()
#
#       'too many closing parentheses': (test) ->
#         test.expect 2
#         try
#           compiler = new Compiler
#           compiler.compile ')'
#         catch e
#           test.equal e.message, 'did not expect ) at 0'
#         try
#           compiler = new Compiler
#           compiler.compile '((foo)))bar'
#         catch e
#           test.equal e.message, 'did not expect ) at 7'
#         test.done()
#
#       'unclosed parentheses': (test) ->
#         test.expect 2
#         compiler = new Compiler
#         try
#           compiler = new Compiler
#           compiler.compile '('
#         catch e
#           test.equal e.message, 'unclosed parentheses at 1'
#         try
#           compiler = new Compiler
#           compiler.compile '(((foo)bar(boo)far)'
#         catch e
#           test.equal e.message, 'unclosed parentheses at 19'
#         test.done()

#   'named segment can have a static prefix': (test) ->
#     pattern = new UrlPattern '/vvv:version/*'
#     test.equal null, pattern.match('/vvv/resource')
#     test.deepEqual pattern.match('/vvv1/resource'),
#       _: 'resource'
#       version: '1'
#     test.equal null, pattern.match('/vvv1.1/resource'),
#     test.done()
#
#   'instance of UrlPattern is handled correctly as constructor argument': (test) ->
#       pattern = new UrlPattern '/user/:userId/task/:taskId'
#       copy = new UrlPattern pattern
#       test.deepEqual copy.match('/user/10/task/52'),
#         userId: '10'
#         taskId: '52'
#       test.done()

  # 'match full stops in segment values': (test) ->
  #     compiler = new UrlPattern.Compiler()
  #     compiler.segmentValueCharset = 'a-zA-Z0-9-_ %.'
  #     pattern = new UrlPattern '/api/v1/user/:id/', compiler
  #     test.deepEqual pattern.match('/api/v1/user/test.name/'),
  #       id: 'test.name'
  #     test.done()
