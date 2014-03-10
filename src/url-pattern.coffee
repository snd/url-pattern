util = require './util'

patternPrototype =
  match: (url) ->
    match = this.regex.exec url
    return null unless match?

    captured = match.slice(1)
    return captured if this.isRegex

    bound = {}
    for value, i in captured
      name = this.names[i]
      if name is '_'
        bound._ ?= []
        bound._.push value
      else
        bound[name] = value

    return bound

module.exports = (arg, separator = '/') ->
  isRegex = arg instanceof RegExp
  unless ('string' is typeof arg) or isRegex
    throw new TypeError 'argument must be a regex or a string'
  pattern = Object.create patternPrototype
  pattern.isRegex = isRegex
  pattern.regex = if isRegex then arg else new RegExp util.toRegexString arg
  pattern.names = util.getNames arg unless isRegex
  return pattern
