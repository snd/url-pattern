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
  UrlPattern = (arg, separator) ->
    # self awareness
    if arg instanceof UrlPattern
      this.isRegex = arg.isRegex
      this.regex = arg.regex
      this.names = arg.names
      return this

    this.isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or this.isRegex
      throw new TypeError 'argument must be a regex or a string'
    [':', '*'].forEach (forbidden) ->
      if separator is forbidden
        throw new Error "separator can't be #{forbidden}"
    if this.isRegex
      this.regex = arg
    else
      this.regex = new RegExp this.toRegexString arg, separator
      this.names = this.getNames arg, separator
    return this

  UrlPattern.prototype.match = (url) ->
    match = this.regex.exec url
    return null unless match?

    captured = match.slice(1)
    if this.isRegex
      return captured

    bound = {}
    for value, i in captured
      name = this.names[i]
      unless value?
        continue
      if name is '_'
        bound._ ?= []
        bound._.push value
      else
        bound[name] = value

    return bound

  # source: http://stackoverflow.com/a/3561711
  UrlPattern.prototype.escapeForRegex = (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  UrlPattern.prototype.getNames = (arg, separator = '/') ->
    return [] if arg instanceof RegExp
    escapedSeparator = this.escapeForRegex separator
    regex = new RegExp "((:?:[^#{escapedSeparator}\(\)]+)|(?:[\*]))", 'g'

    names = []
    results = regex.exec arg

    while results?
      name = results[1].slice(1)

      if name is '_'
        throw new TypeError(":_ can't be used as a pattern name in pattern #{arg}")

      if name in names
        throw new TypeError("duplicate pattern name :#{name} in pattern #{arg}")

      names.push name || '_'
      results = regex.exec arg
    names

  UrlPattern.prototype.escapeSeparators = (string, separator = '/') ->
    escapedSeparator = UrlPattern.prototype.escapeForRegex separator
    regex = new RegExp escapedSeparator, 'g'
    string.replace regex, escapedSeparator

  UrlPattern.prototype.toRegexString = (string, separator = '/') ->
    # escape the seperators in the pattern string such that
    # regex command chars (., ^, $, ...) can be used as separators
    stringWithEscapedSeparators = UrlPattern.prototype.escapeSeparators string, separator

    stringWithEscapedSeparators = stringWithEscapedSeparators
      # replace optional param
      .replace(/\((.*?)\)/g, '(?:$1)?')
      # replace wildcard patterns
      .replace(/\*/g, '(.*?)')


    # replace named segment pattern strings (:pattern) with
    # regexes that capture and match everything until the \\ char (in case the
    # separator was escaped) or the separator char (in case the separator
    # didn't need escaping)
    escapedSeparator = UrlPattern.prototype.escapeForRegex separator
    UrlPattern.prototype.getNames(string, separator).forEach (name) ->
      stringWithEscapedSeparators = stringWithEscapedSeparators
        .replace(':' + name,"([^\\#{separator}]+)")

    return "^#{stringWithEscapedSeparators}$"
  
  UrlPattern.newPattern = () ->
    # helpful hint for new API
    throw Error('`urlPattern.newPattern` is no longer supported.  Use `new Pattern` instead.');

  return UrlPattern
)
