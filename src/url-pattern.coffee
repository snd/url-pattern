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

  # source: http://stackoverflow.com/a/3561711
  escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

################################################################################
# generic parser combinators

  P = {}

  P.Result = (value, rest) ->
    this.value = value
    this.rest = rest
    return

  P.nothing = (input) ->
    return new P.Result null, input

  P.anyChar = (input) ->
    if input is ''
      return
    return new P.Result input.charAt(0), input.slice(1)

  P.string = (string) ->
    if string is ''
      throw new Error '`string` must not be blank'
    (input) ->
      # TODO could optimize this for chars (if string.length is 1)
      if input.slice(0, string.length) is string
        return new P.Result string, input.slice(string.length)

  P.charset = (charset) ->
    regex = new RegExp '^['  + charset + ']$'
    (input) ->
      char = input.charAt(0)
      unless regex.test char
        return
      return new P.Result char, input.slice(1)

  P.choice = (parsers) ->
    (input) ->
      index = -1
      length = parsers.length
      while ++index < length
        result = parsers[index] input
        if result?
          return result
      return

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

  P.many1 = (parser) ->
    (input) ->
      P.baseMany parser, null, false, true, input

  P.concatMany1 = (parser) ->
    (input) ->
      P.baseMany parser, null, true, true, input

  P.concatMany1Till = (parser, end) ->
    (input) ->
      P.baseMany parser, end, true, true, input

  P.lazy = (fn) ->
    cached = null
    (input) ->
      unless cached?
        cached = fn()
      return cached input

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

  P.between = (open, parser, close) ->
    (input) ->
      openResult = open input
      unless openResult?
        return
      parserResult = parser openResult.rest
      unless parserResult?
        return
      closeResult = close parserResult.rest
      unless closeResult?
        return
      return new P.Result(parserResult.value, closeResult.rest)

################################################################################
# url-pattern specific parser combinators

  U = {}

  U.wildcard = P.tag 'wildcard', P.string('*')

  U.optional = P.tag(
    'optional'
    P.between(
      P.string('(')
      P.lazy(-> U.pattern)
      P.string(')')
    )
  )

  U.name = P.concatMany1 P.charset 'a-zA-Z0-9'

  U.named = P.tag(
    'named',
    P.between(
      P.string(':')
      P.lazy(-> U.name)
      P.nothing
    )
  )

  U.escapedChar = P.between(
    P.string('\\')
    P.anyChar
    P.nothing
  )

  U.static = P.tag(
    'static'
    P.concatMany1Till(
      P.choice([
        P.lazy(-> U.escapedChar)
        P.anyChar
      ])
      P.charset('\\*\\(\\):')
    )
  )

  U.token = P.lazy ->
    P.choice [U.wildcard, U.optional, U.named, U.static]

  U.pattern = P.many1 P.lazy(-> U.token)

################################################################################
# functions that further process ASTs returned by parsers

  baseAstNodeToRegexString = (astNode) ->
    if Array.isArray astNode.value
      inner = astNode.value.map(baseAstNodeToRegexString).join('')
      if astNode.tag is 'optional'
        return '(?:' + inner + ')?'
      return inner

    if astNode.tag is 'wildcard'
      return '(.*?)'

    if astNode.tag is 'named'
      # TODO make this charset configurable again
      return '([a-zA-Z0-9-_ %]+)'

    if astNode.tag is 'static'
      return escapeForRegex(astNode.value)

  astNodeToRegexString = (astNode) ->
    '^' + baseAstNodeToRegexString(astNode) + '$'

  astNodeToNames = (astNode) ->
    if Array.isArray astNode.value
      results = []
      index = -1
      length = astNode.value.length
      while ++index < length
        results = results.concat astNodeToNames astNode.value[index]
      return results

    if astNode.tag is 'wildcard'
      return ['_']

    if astNode.tag is 'named'
      return [astNode.value]

    if astNode.tag is 'static'
      return []

################################################################################
# Compiler
# compiles a regex string while parsing a pattern string.
# state machine that iterates through an input `string` (representing an
# url pattern) and writes a `regexString` that matches the pattern.

  Compiler = ->

  Compiler.prototype.escapeChar = '\\'
  Compiler.prototype.segmentNameStartChar = ':'
  Compiler.prototype.segmentNameCharset = 'a-zA-Z0-9'
  Compiler.prototype.segmentValueCharset = 'a-zA-Z0-9-_ %'
  Compiler.prototype.optionalSegmentStartChar = '('
  Compiler.prototype.optionalSegmentEndChar = ')'
  Compiler.prototype.wildcardChar = '*'

  Compiler.prototype.segmentValueRegexString = ->
    "([" + @segmentValueCharset + "]+)"

  Compiler.prototype.segmentNameCharRegex = ->
    new RegExp '^['  + @segmentNameCharset + ']$'

  # transition to another mode in the state machine
  Compiler.prototype.transition = (nextMode) ->
    # continue with current mode
    if @mode is nextMode
      if @mode is 'namedSegment' or @mode is 'staticSegment'
        # consume segment
        @segment += @char
      return

    # enter different mode

    if @mode is 'staticSegmentEscapeNextChar' and nextMode is 'staticSegment'
      @segment += @char
      @mode = nextMode
      return

    unless @mode is 'staticSegment' and nextMode is 'staticSegmentEscapeNextChar'
      # exit current mode
      switch @mode
        when 'namedSegment'
          @names.push @segment
          @regexString += @segmentValueRegexString()
        when 'staticSegment'
          @regexString += escapeForRegex(@segment)
        when 'namedSegmentStart'
          unless nextMode is 'namedSegment'
            throw new Error "`#{@segmentNameStartChar}` must be followed by the name of the named segment consisting of at least one character in character set `#{@segmentNameCharset}` at #{@index}"

    if @mode isnt 'staticSegment' and nextMode is 'staticSegmentEscapeNextChar'
      @segment = ''

    if nextMode is 'namedSegment' or nextMode is 'staticSegment'
      @segment = @char

    @mode = nextMode

  Compiler.prototype.compile = (string) ->
    # input
    @string = string

    # state of the parser/compiler state machine.
    # compiler methods share state through the compiler instance.
    @index = -1
    @char = ''
    @mode = 'unknown'
    @segment = ''
    @openParens = 0

    # output
    @names = []
    @regexString = '^'

    # moved out of loop for reasons of performance
    segmentNameCharRegex = @segmentNameCharRegex()

    length = @string.length
    # the loop maps current char and current mode into the next mode
    while ++@index < length
      @char = @string.charAt(@index)

      if @mode is 'staticSegmentEscapeNextChar'
        @transition('staticSegment')
        continue

      switch @char
        when @segmentNameStartChar
          if @mode is 'namedSegment'
            throw new Error "cannot start named segment right after named segment at #{@index}"
          @transition('namedSegmentStart')
        when @escapeChar
          @transition('staticSegmentEscapeNextChar')
        when @optionalSegmentStartChar
          @transition('unknown')
          @openParens++
          @regexString += '(?:'
        when @optionalSegmentEndChar
          @transition('unknown')
          @openParens--
          if @openParens < 0
            throw new Error "did not expect #{@optionalSegmentEndChar} at #{@index}"
          @regexString += ')?'
        when @wildcardChar
          @transition('unknown')
          @regexString += '(.*?)'
          @names.push '_'
        # char without special meaning
        else
          switch @mode
            when 'namedSegmentStart'
              if segmentNameCharRegex.test(@char)
                @transition('namedSegment')
              else
                # this throws an error because named segment start must be followed
                # by a named segment
                @transition('staticSegment')
            when 'namedSegment'
              if segmentNameCharRegex.test(@char)
                @transition('namedSegment')
              else
                # end named segment and start static segment
                @transition('staticSegment')
            when 'staticSegment'
              @transition('staticSegment')
            when 'unknown'
              @transition('staticSegment')

    if @openParens > 0
      throw new Error "unclosed parentheses at #{@index}"

    @transition('unknown')

    @regexString += '$'
    @regex = new RegExp @regexString

    return

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
      ast = U.pattern arg
      unless ast?
        # TODO better error message
        throw new Error 'couldnt parse'
      if ast.rest isnt ''
        # TODO better error message
        throw new Error 'couldnt parse completely'
      @ast = ast

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

################################################################################
# exports

  UrlPattern.Compiler = Compiler
  UrlPattern.escapeForRegex = escapeForRegex
  UrlPattern.astNodeToRegexString = astNodeToRegexString
  UrlPattern.astNodeToNames = astNodeToNames
  UrlPattern.P = P
  UrlPattern.U = U

  return UrlPattern
)
