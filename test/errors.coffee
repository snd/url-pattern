UrlPattern = require '../src/url-pattern'

module.exports =

  'invalid argument': (test) ->
    UrlPattern
    test.expect 5
    try
      new UrlPattern()
    catch e
      test.equal e.message, "argument must be a regex or a string"
    try
      new UrlPattern(5)
    catch e
      test.equal e.message, "argument must be a regex or a string"
    try
      new UrlPattern ''
    catch e
      test.equal e.message, "argument must not be the empty string"
    try
      new UrlPattern ' '
    catch e
      test.equal e.message, "argument must not contain whitespace"
    try
      new UrlPattern ' fo o'
    catch e
      test.equal e.message, "argument must not contain whitespace"
    test.done()

  'invalid variable name in pattern': (test) ->
    UrlPattern
    test.expect 3
    try
      new UrlPattern ':'
    catch e
      test.equal e.message, "couldn't parse pattern"
    try
      new UrlPattern ':.'
    catch e
      test.equal e.message, "couldn't parse pattern"
    try
      new UrlPattern 'foo:.'
    catch e
      # TODO `:` must be followed by the name of the named segment consisting of at least one character in character set `a-zA-Z0-9` at 4
      test.equal e.message, "could only partially parse pattern"
    test.done()

    # TODO detect this again
#   'variable directly after variable': (test) ->
#     test.expect 2
#     try
#       compiler = new Compiler
#       compiler.compile ':foo:bar'
#     catch e
#       test.equal e.message, 'cannot start named segment right after named segment at 4'
#     try
#       compiler = new Compiler
#       compiler.compile 'foo:foo:bar.bar'
#     catch e
#       test.equal e.message, 'cannot start named segment right after named segment at 7'
#     test.done()

  'too many closing parentheses': (test) ->
    test.expect 2
    try
      new UrlPattern ')'
    catch e
      # TODO did not expect ) at 0
      test.equal e.message, "couldn't parse pattern"
    try
      new UrlPattern '((foo)))bar'
    catch e
      # TODO did not expect ) at 7
      test.equal e.message, "could only partially parse pattern"
    test.done()

  'unclosed parentheses': (test) ->
    test.expect 2
    try
      new UrlPattern '('
    catch e
      # TODO unclosed parentheses at 1
      test.equal e.message, "couldn't parse pattern"
    try
      new UrlPattern '(((foo)bar(boo)far)'
    catch e
      # TODO unclosed parentheses at 19
      test.equal e.message, "couldn't parse pattern"
    test.done()
