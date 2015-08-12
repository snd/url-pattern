((root, factory) ->
  # AMD
  if ('function' is typeof define) and define.amd?
    define([], factory)
  # CommonJS
  else if exports?
    module.exports = factory()
  # no module system
  else
    root.UrlPattern = factory()
)(this, ->

################################################################################
# helpers

  # source: http://stackoverflow.com/a/3561711
  escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  concatMap = (array, f) ->
    results = []
    i = -1
    length = array.length
    while ++i < length
      results = results.concat f(array[i])
    return results

  stringConcatMap = (array, f) ->
    result = ''
    i = -1
    length = array.length
    while ++i < length
      result += f(array[i])
    return result

  # source: http://stackoverflow.com/a/16047223
  regexGroupCount = (regex) ->
    (new RegExp(regex.toString() + '|')).exec('').length - 1

  keysAndValuesToObject = (keys, values) ->
    object = {}
    i = -1
    length = keys.length
    while ++i < length
      key = keys[i]
      value = values[i]
      unless value?
        continue
      # key already encountered
      if object[key]?
        # capture multiple values for same key in an array
        unless Array.isArray object[key]
          object[key] = [object[key]]
        object[key].push value
      else
        object[key] = value
    return object

################################################################################
# parser combinators
# subset copied from
# https://github.com/snd/pcom/blob/master/src/pcom.coffee
# (where they are tested !)
# to keep this at zero dependencies and small filesize

  P = {}

  P.Result = (value, rest) ->
    this.value = value
    this.rest = rest
    return

  P.Tagged = (tag, value) ->
    this.tag = tag
    this.value = value
    return

  P.tag = (tag, parser) ->
    (input) ->
      result = parser input
      unless result
        return
      tagged = new P.Tagged tag, result.value
      return new P.Result tagged, result.rest

  P.regex = (arg) ->
    regex = if 'string' is typeof arg then new RegExp '^' + arg else arg
    (input) ->
      matches = regex.exec input
      unless matches?
        return
      result = matches[0]
      return new P.Result result, input.slice(result.length)

  P.sequence = (parsers...) ->
    (input) ->
      i = -1
      length = parsers.length
      values = []
      rest = input
      while ++i < length
        parser = parsers[i]
        unless 'function' is typeof parser
          throw new Error "parser passed at index `#{i}` into `sequence` is not of type `function` but of type `#{typeof parser}`"
        result = parser rest
        unless result?
          return
        values.push result.value
        rest = result.rest
      return new P.Result values, rest

  P.pick = (indexes, parsers...) ->
    (input) ->
      result = P.sequence(parsers...)(input)
      unless result?
        return
      array = result.value
      unless Array.isArray indexes
        result.value = array[indexes]
      else
        result.value = []
        indexes.forEach (i) ->
          result.value.push array[i]
      return result

  P.string = (string) ->
    length = string.length
    if length is 0
      throw new Error '`string` must not be blank'
    else if length is 1
      (input) ->
        if input.charAt(0) is string
          return new P.Result string, input.slice(1)
    else
      (input) ->
        if input.slice(0, length) is string
          return new P.Result string, input.slice(length)

  P.anyChar = (input) ->
    if input is ''
      return
    return new P.Result input.charAt(0), input.slice(1)

  P.lazy = (fn) ->
    cached = null
    (input) ->
      unless cached?
        cached = fn()
      return cached input

  P.charset = (charset) ->
    regex = new RegExp '^['  + charset + ']$'
    (input) ->
      char = input.charAt(0)
      unless regex.test char
        return
      return new P.Result char, input.slice(1)

  P.baseMany = (parser, end, stringResult, atLeastOneResultRequired, input) ->
    rest = input
    results = if stringResult then '' else []
    while true
      if end?
        endResult = end rest
        if endResult?
          break
      parserResult = parser rest
      unless parserResult?
        break
      if stringResult
        results += parserResult.value
      else
        results.push parserResult.value
      rest = parserResult.rest

    if atLeastOneResultRequired and results.length is 0
      return

    return new P.Result results, rest

  P.concatMany1Till = (parser, end) ->
    (input) ->
      P.baseMany parser, end, true, true, input

  P.firstChoice = (parsers...) ->
    (input) ->
      i = -1
      length = parsers.length
      while ++i < length
        parser = parsers[i]
        unless 'function' is typeof parser
          throw new Error "parser passed at index `#{i}` into `firstChoice` is not of type `function` but of type `#{typeof parser}`"
        result = parser input
        if result?
          return result
      return

  P.many1 = (parser) ->
    (input) ->
      P.baseMany parser, null, false, true, input

  # for debugging
  P.log = (id, parser) ->
    (input) ->
      output = parser input
      msg =
        id: id
        input: input
      if output?
        msg.consumed = input.slice(0, input.length - output.rest.length)
        msg.rest = output?.rest
        msg.value = output?.value
        console.log msg
      return output

################################################################################
# url pattern parser
# copied from
# https://github.com/snd/pcom/blob/master/src/url-pattern-example.coffee

  newParser = (options) ->
    U = {}

    U.wildcard = P.tag 'wildcard', P.string(options.wildcardChar)

    U.name = P.regex '^[a-zA-Z0-9]+'

    U.optional = P.tag(
      'optional'
      P.pick(1,
        P.string(options.optionalSegmentStartChar)
        P.lazy(-> U.pattern)
        P.string(options.optionalSegmentEndChar)
      )
    )

    U.named = P.tag(
      'named',
      P.pick(1,
        P.string(options.segmentNameStartChar)
        P.lazy(-> U.name)
      )
    )

    U.escapedChar = P.pick(1,
      P.string(options.escapeChar)
      P.anyChar
    )

    U.static = P.tag(
      'static'
      P.concatMany1Till(
        P.firstChoice(
          P.lazy(-> U.escapedChar)
          P.anyChar
        )
        P.charset('\\*\\(\\):')
      )
    )

    U.token = P.lazy ->
      P.firstChoice(
        U.wildcard
        U.optional
        U.named
        U.static
      )

    U.pattern = P.many1 P.lazy(-> U.token)

    return U

  defaultParser = newParser(
    escapeChar: '\\'
    segmentNameStartChar: ':'
    optionalSegmentStartChar: '('
    optionalSegmentEndChar: ')'
    wildcardChar: '*'
  )

################################################################################
# functions that further process ASTs returned as `.value` by parsers

  baseAstNodeToRegexString = (astNode) ->
    if Array.isArray astNode
      return astNode.map(baseAstNodeToRegexString).join('')

    if astNode.tag is 'wildcard'
      return '(.*?)'

    if astNode.tag is 'named'
      # TODO make this charset configurable again
      return '([a-zA-Z0-9-_~ %]+)'

    if astNode.tag is 'static'
      return escapeForRegex(astNode.value)

    if astNode.tag is 'optional'
      return '(?:' + baseAstNodeToRegexString(astNode.value) + ')?'

  astNodeToRegexString = (astNode) ->
    '^' + baseAstNodeToRegexString(astNode) + '$'

  astNodeToNames = (astNode) ->
    if Array.isArray astNode
      results = []
      i = -1
      length = astNode.length
      while ++i < length
        results = results.concat astNodeToNames astNode[i]
      return results

    if astNode.tag is 'wildcard'
      return ['_']

    if astNode.tag is 'named'
      return [astNode.value]

    if astNode.tag is 'static'
      return []

    if astNode.tag is 'optional'
      return astNodeToNames(astNode.value)

  stringify = (astNode, params) ->

################################################################################
# UrlPattern

  UrlPattern = (arg1, arg2) ->
    # self awareness
    if arg1 instanceof UrlPattern
      @isRegex = arg1.isRegex
      @regex = arg1.regex
      @ast = arg1.ast
      @names = arg1.names
      return

    @isRegex = arg1 instanceof RegExp

    unless ('string' is typeof arg1) or @isRegex
      throw new TypeError 'argument must be a regex or a string'

    # regex
    if @isRegex
      @regex = arg1
      if arg2?
        unless Array.isArray arg2
          throw new Error 'if first argument is a regex the second argument may be an array of group names but you provided something else'
        groupCount = regexGroupCount @regex
        unless arg2.length is groupCount
          throw new Error "regex contains #{groupCount} groups but array of group names contains #{arg2.length}"
        @names = arg2
      return

    # string pattern

    if arg1 is ''
      throw new Error 'argument must not be the empty string'
    withoutWhitespace = arg1.replace(/\s+/g, '')
    unless withoutWhitespace is arg1
      throw new Error 'argument must not contain whitespace'

    # if arg2?
      # TODO handle options
    parsed = defaultParser.pattern arg1
    unless parsed?
      # TODO better error message
      throw new Error "couldn't parse pattern"
    if parsed.rest isnt ''
      # TODO better error message
      throw new Error "could only partially parse pattern"
    @ast = parsed.value

    @regex = new RegExp astNodeToRegexString @ast
    @names = astNodeToNames @ast

    return

  UrlPattern.prototype.match = (url) ->
    match = @regex.exec url
    unless match?
      return null

    groups = match.slice(1)
    if @names
      keysAndValuesToObject @names, groups
    else
      groups


  UrlPattern.prototype.stringify = (params) ->
    # TODO only works for non-regex patterns
    # TODO check that params is an object
    stringify @ast, params

################################################################################
# exports

  # helpers
  UrlPattern.escapeForRegex = escapeForRegex
  UrlPattern.concatMap = concatMap
  UrlPattern.stringConcatMap = stringConcatMap
  UrlPattern.regexGroupCount = regexGroupCount
  UrlPattern.keysAndValuesToObject = keysAndValuesToObject

  # parsers
  UrlPattern.P = P
  UrlPattern.newParser = newParser
  UrlPattern.defaultParser = defaultParser

  # ast
  UrlPattern.astNodeToRegexString = astNodeToRegexString
  UrlPattern.astNodeToNames = astNodeToNames
  UrlPattern.stringify = stringify

  return UrlPattern
)
