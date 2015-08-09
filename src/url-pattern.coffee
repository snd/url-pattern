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
    index = -1
    length = array.length
    while ++index < length
      results = results.concat f(array[index])
    return results

  stringConcatMap = (array, f) ->
    result = ''
    index = -1
    length = array.length
    while ++index < length
      result += f(array[index])
    return result

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

################################################################################
# url pattern parser
# copied from
# https://github.com/snd/pcom/blob/master/src/url-pattern-example.coffee

  U = {}

  U.wildcard = P.tag 'wildcard', P.string('*')

  U.name = P.regex '^[a-zA-Z0-9]+'

  U.optional = P.tag(
    'optional'
    P.pick(1,
      P.string('(')
      P.lazy(-> U.pattern)
      P.string(')')
    )
  )

  U.named = P.tag(
    'named',
    P.pick(1,
      P.string(':')
      P.lazy(-> U.name)
    )
  )

  U.escapedChar = P.pick(1,
    P.string('\\')
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
      index = -1
      length = astNode.length
      while ++index < length
        results = results.concat astNodeToNames astNode[index]
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

  UrlPattern = (arg) ->
    # self awareness
    if arg instanceof UrlPattern
      @isRegex = arg.isRegex
      @regex = arg.regex
      @ast = arg.ast
      @names = arg.names
      return

    @isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or @isRegex
      throw new TypeError 'argument must be a regex or a string'

    if @isRegex
      @regex = arg
    else
      parsed = U.pattern arg
      unless parsed?
        # TODO better error message
        throw new Error 'couldnt parse'
      if parsed.rest isnt ''
        # TODO better error message
        throw new Error 'couldnt parse completely'
      @ast = parsed.value

      @regex = new RegExp astNodeToRegexString @ast
      @names = astNodeToNames @ast

    return

  UrlPattern.prototype.match = (url) ->
    match = @regex.exec url
    unless match?
      return null

    captured = match.slice(1)
    if @isRegex
      return captured

    bound = {}
    index = -1
    length = captured.length
    while ++index < length
      value = captured[index]
      name = @names[index]
      # nothing captured for this binding
      unless value?
        continue
      # already bound
      if bound[name]?
        # capture multiple bindings for same name in an array
        unless Array.isArray bound[name]
          bound[name] = [bound[name]]
        bound[name].push value
      else
        bound[name] = value
    return bound

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

  # parsers
  UrlPattern.P = P
  UrlPattern.U = U

  # ast
  UrlPattern.astNodeToRegexString = astNodeToRegexString
  UrlPattern.astNodeToNames = astNodeToNames
  UrlPattern.stringify = stringify

  return UrlPattern
)
