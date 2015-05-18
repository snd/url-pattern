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

  UrlPattern = (arg, compiler) ->
    compiler ?= new UrlPattern.Compiler
    # self awareness
    if arg instanceof UrlPattern
      @isRegex = arg.isRegex
      @regex = arg.regex
      @names = arg.names
      return

    @isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or @isRegex
      throw new TypeError 'argument must be a regex or a string'

    if @isRegex
      @regex = arg
    else
      compiler.compile(arg)
      @regex = compiler.regex
      @names = compiler.names

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

  return UrlPattern
)
