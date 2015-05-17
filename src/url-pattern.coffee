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
# PatternToRegexCompiler
# compiles a regex string while parsing a pattern string.
# state machine that iterates through an input `string` (representing an
# url pattern) and writes a `regexString` that matches the pattern.

  PatternToRegexCompiler = ->

  PatternToRegexCompiler.prototype.escapeChar = '\\'
  PatternToRegexCompiler.prototype.segmentValueCharset = 'a-zA-Z0-9-_ %'
  PatternToRegexCompiler.prototype.segmentNameStartChar = ':'
  PatternToRegexCompiler.prototype.segmentNameCharset = 'a-zA-Z0-9'

  PatternToRegexCompiler.prototype.segmentValueRegexString = ->
    "([" + @segmentValueCharset + "]+)"

  PatternToRegexCompiler.prototype.segmentNameCharRegex = ->
    new RegExp '^['  + @segmentNameCharset + ']$'

  # helper for debugging
  PatternToRegexCompiler.prototype.state = ->
    {
      string: @string
      index: @index
      char: @char
      mode: @mode
      segment: @segment
      names: @names
      regexString: @regexString
      openParens: @openParens
    }

  PatternToRegexCompiler.prototype.continueOrEnterMode = (nextMode) ->
    # console.log("continueOrEnterMode(#{mode})")
    # console.log @state()

    # continue with same mode
    if @mode is nextMode
      if @mode is 'namedSegment' or @mode is 'staticSegment'
        # consume segment
        @segment += @char

    # enter different mode
    else
      if nextMode is 'staticSegmentEscapeNextChar'
        if @mode isnt 'staticSegment'
          @exitMode(nextMode)
          @segment = ''
        # do nothing when staticSegment -> staticSegmentEscapeNextChar
      else if @mode is 'staticSegmentEscapeNextChar' and nextMode is 'staticSegment'
        @segment += @char
      else
        @exitMode(nextMode)
        if nextMode is 'namedSegment' or nextMode is 'staticSegment'
          @segment = @char

      @mode = nextMode

  PatternToRegexCompiler.prototype.exitMode = (nextMode = 'unknown') ->
    # console.log("exitMode(#{mode})")
    # console.log @state()

    switch @mode
      when 'namedSegment'
        @names.push @segment
        @regexString += @segmentValueRegexString()
      when 'staticSegment'
        @regexString += escapeForRegex(@segment)
      when 'namedSegmentStart'
        unless nextMode is 'namedSegment'
          throw new Error "`#{@segmentNameStartChar}` must be followed by the name of the named segment consisting of at least one character in character set `#{@segmentNameCharset}` at #{@index}"
    @mode = 'unknown'

  PatternToRegexCompiler.prototype.compile = (string) ->
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
        @continueOrEnterMode('staticSegment')
        continue

      switch @char
        when @segmentNameStartChar
          if @mode is 'namedSegment'
            throw new Error "cannot start named segment right after named segment at #{@index}"
          @continueOrEnterMode('namedSegmentStart')
        when @escapeChar
          @continueOrEnterMode('staticSegmentEscapeNextChar')
        when '('
          @exitMode()
          @openParens++
          @regexString += '(?:'
        when ')'
          @exitMode()
          @openParens--
          if @openParens < 0
            throw new Error "did not expect ) at #{@index}"
          @regexString += ')?'
        when '*'
          @exitMode()
          @regexString += '(.*?)'
          @names.push '_'
        # char without special meaning
        else
          switch @mode
            when 'namedSegmentStart'
              if segmentNameCharRegex.test(@char)
                @continueOrEnterMode('namedSegment')
              else
                # this throws an error because named segment start must be followed
                # by a named segment
                @continueOrEnterMode('staticSegment')
            when 'namedSegment'
              if segmentNameCharRegex.test(@char)
                @continueOrEnterMode('namedSegment')
              else
                # end named segment and start static segment
                @continueOrEnterMode('staticSegment')
            when 'staticSegment'
              @continueOrEnterMode('staticSegment')
            when 'unknown'
              @continueOrEnterMode('staticSegment')

    if @openParens > 0
      throw new Error "unclosed parentheses at #{@index}"

    @exitMode()

    @regexString += '$'
    @regex = new RegExp @regexString

    return

################################################################################
# UrlPattern

  UrlPattern = (arg, compiler = new PatternToRegexCompiler) ->
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
    for value, i in captured
      name = @names[i]
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

  UrlPattern.PatternToRegexCompiler = PatternToRegexCompiler
  UrlPattern.escapeForRegex = escapeForRegex

  return UrlPattern
)
