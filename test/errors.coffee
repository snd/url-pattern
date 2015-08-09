UrlPattern = require '../src/url-pattern'

module.exports = {}

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
