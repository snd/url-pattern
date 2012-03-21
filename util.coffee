_ = require 'underscore'

module.exports = util =

    getNames: (arg) ->
        return [] if _.isRegExp arg
        regex = /:([^\/]+)/g

        names = []
        results = regex.exec arg

        while results?
            names.push results[1]
            results = regex.exec arg
        names

    toRegex: (arg) -> if _.isRegExp arg then arg else new RegExp util.toRegexString arg

    toRegexString: (arg) ->
        _.each util.getNames(arg), (name) -> arg = arg.replace(':' + name, '([^\/]+)')
        arg = arg.replace /\*/g, '.*'

        '^'  + arg + '$'
