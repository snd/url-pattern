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
  UrlPattern = (arg) ->
    # self awareness
    if arg instanceof UrlPattern
      this.isRegex = arg.isRegex
      this.regex = arg.regex
      this.names = arg.names
      return this

    this.isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or this.isRegex
      throw new TypeError 'argument must be a regex or a string'
    if this.isRegex
      this.regex = arg
    else
      this.compile(arg)
    return this

  UrlPattern.prototype.match = (url) ->
    match = this.regex.exec url
    unless match?
      return null

    captured = match.slice(1)
    if this.isRegex
      return captured

    bound = {}
    for value, i in captured
      name = this.names[i]
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

  alphanumericRegex = new RegExp '^[a-zA-Z0-9-_]+$'

  UrlPattern.prototype.isAlphanumeric = (string) ->
    alphanumericRegex.test(string)

  # source: http://stackoverflow.com/a/3561711
  UrlPattern.prototype.escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  UrlPattern.prototype.compile = (string) ->
    names = []
    regexString = '^'
    mode = '?'
    sliceBegin = 0
    openParens = 0

    that = this

    index = -1

    leave = ->
      switch mode
        when 'variable'
          if (index - sliceBegin) < 2
            throw new Error "`:` must be followed by at least one alphanumeric character that is the variable name at #{index}"
          names.push string.slice(sliceBegin + 1, index)
          regexString += "([a-zA-Z0-9-_]+)"
        when 'static'
          regexString += that.escapeForRegex(string.slice(sliceBegin, index))
      mode = '?'

    enter = (nextMode) ->
      if nextMode is mode
        return
      leave()
      sliceBegin = index
      mode = nextMode

    length = string.length
    while ++index < length
      char = string.charAt(index)
      if char is ':'
        if mode is 'variable'
          throw new Error "cannot start variable right after variable at #{index}"
        enter('variable')
      else if char is '('
        leave()
        openParens++
        regexString += '(?:'
      else if char is ')'
        leave()
        openParens--
        if openParens < 0
          throw new Error "did not expect ) at #{index}"
        regexString += ')?'
      else if char is '*'
        leave()
        regexString += '(.*?)'
        names.push '_'
      else
        switch mode
          when 'variable'
            unless this.isAlphanumeric char
              enter('static')
          when '?'
            enter('static')

    if openParens > 0
      throw new Error "unclosed parentheses at #{index}"

    leave()

    regexString += '$'

    this.names = names
    this.regex = new RegExp regexString

  UrlPattern.newPattern = ->
    throw Error('`urlPattern.newPattern` is no longer supported.  Use `new Pattern` instead.')

  return UrlPattern
)
