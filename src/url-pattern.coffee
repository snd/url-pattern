module.exports =

  PatternPrototype:
    match: (url) ->
      match = this.regex.exec url
      return null unless match?

      captured = match.slice(1)
      return captured if this.isRegex

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

  newPattern: (arg, separator = '/') ->
    isRegex = arg instanceof RegExp
    unless ('string' is typeof arg) or isRegex
      throw new TypeError 'argument must be a regex or a string'
    [':', '*'].forEach (forbidden) ->
      if separator is forbidden
        throw new Error "separator can't be #{forbidden}"
    pattern = Object.create module.exports.PatternPrototype
    pattern.isRegex = isRegex
    pattern.regex =
      if isRegex
        arg
      else
        regexString = module.exports.toRegexString arg, separator
        new RegExp regexString
    pattern.names = module.exports.getNames arg, separator unless isRegex
    return pattern

  # source: http://stackoverflow.com/a/3561711
  escapeForRegex: (string) ->
    string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')

  getNames: (arg, separator = '/') ->
    return [] if arg instanceof RegExp
    escapedSeparator = module.exports.escapeForRegex separator
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

  escapeSeparators: (string, separator = '/') ->
    escapedSeparator = module.exports.escapeForRegex separator
    regex = new RegExp escapedSeparator, 'g'
    string.replace regex, escapedSeparator

  toRegexString: (string, separator = '/') ->
    # escape the seperators in the pattern string such that
    # regex command chars (., ^, $, ...) can be used as separators
    stringWithEscapedSeparators = module.exports.escapeSeparators string, separator

    stringWithEscapedSeparators = stringWithEscapedSeparators
      # replace optional param
      .replace(/\((.*?)\)/g, '(?:$1)?')
      # replace wildcard patterns
      .replace(/\*/g, '(.*?)')


    # replace named segment pattern strings (:pattern) with
    # regexes that capture and match everything until the \\ char (in case the
    # separator was escaped) or the separator char (in case the separator
    # didn't need escaping)
    escapedSeparator = module.exports.escapeForRegex separator
    module.exports.getNames(string, separator).forEach (name) ->
      stringWithEscapedSeparators = stringWithEscapedSeparators
        .replace(':' + name,"([^\\#{separator}]+)")

    return "^#{stringWithEscapedSeparators}$"
