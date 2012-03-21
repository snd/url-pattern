_ = require 'underscore'

util = require './util'

module.exports = class

    constructor: (arg) ->
        if not (_.isRegExp(arg) or _.isString(arg))
            throw new TypeError 'argument must be either a regex or a string'

        @isRegex = _.isRegExp arg
        @regex = util.toRegex arg
        @names = util.getNames arg if not @isRegex

    match: (url) ->
        match = @regex.exec url
        return null if not match?

        captured = match[1..]
        return captured if @isRegex

        bound = {}
        _.each _.zip(captured, @names), ([value, name]) -> bound[name] = value
        bound
