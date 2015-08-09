UrlPattern = require '../src/url-pattern'

module.exports =

  'astNodeToRegexString and astNodeToNames produce correct results':

    # TODO empty string is no longer a valid pattern
    # or make a test for the empty string as a valid pattern
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

    'just single char variable': (test) ->
      parsed = UrlPattern.U.pattern ':a'
      test.equal UrlPattern.astNodeToRegexString(parsed.value), '^([a-zA-Z0-9-_~ %]+)$'
      test.deepEqual UrlPattern.astNodeToNames(parsed.value), ['a']
      test.done()

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
