{
  escapeForRegex
  concatMap
  stringConcatMap
  regexGroupCount
} = require '../src/url-pattern'

module.exports =

  'escapeForRegex': (test) ->
    expected = '\\[\\-\\/\\\\\\^\\$\\*\\+\\?\\.\\(\\)\\|\\[\\]\\{\\}\\]'
    actual = escapeForRegex('[-\/\\^$*+?.()|[\]{}]')
    test.equal expected, actual

    test.equal escapeForRegex('a$98kdjf(kdj)'), 'a\\$98kdjf\\(kdj\\)'
    test.equal 'a', escapeForRegex 'a'
    test.equal '!', escapeForRegex '!'
    test.equal '\\.', escapeForRegex '.'
    test.equal '\\/', escapeForRegex '/'
    test.equal '\\-', escapeForRegex '-'
    test.equal '\\-', escapeForRegex '-'
    test.equal '\\[', escapeForRegex '['
    test.equal '\\]', escapeForRegex ']'
    test.equal '\\(', escapeForRegex '('
    test.equal '\\)', escapeForRegex ')'
    test.done()

  'concatMap': (test) ->
    test.deepEqual [], concatMap [], ->
    test.deepEqual [1], concatMap [1], (x) -> [x]
    test.deepEqual [1, 1, 1, 2, 2, 2, 3, 3, 3], concatMap [1, 2, 3], (x) -> [x, x, x]
    test.done()

  'stringConcatMap': (test) ->
    test.equal '', stringConcatMap [], ->
    test.equal '1', stringConcatMap [1], (x) -> x
    test.equal '123', stringConcatMap [1, 2, 3], (x) -> x
    test.equal '1a2a3a', stringConcatMap [1, 2, 3], (x) -> x + 'a'
    test.done()

  'regexGroupCount': (test) ->
    test.equal 0, regexGroupCount /foo/
    test.equal 1, regexGroupCount /(foo)/
    test.equal 2, regexGroupCount /((foo))/
    test.equal 2, regexGroupCount /(fo(o))/
    test.equal 2, regexGroupCount /f(o)(o)/
    test.equal 2, regexGroupCount /f(o)o()/
    test.equal 5, regexGroupCount /f(o)o()()(())/
    test.done()
