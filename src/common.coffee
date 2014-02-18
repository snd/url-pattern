module.exports = common =

    getNames: (arg) ->
        return [] if arg instanceof RegExp
        regex = /((:?:[^\/]+)|(?:[\*]))/g

        names = []
        results = regex.exec arg

        while results?
            names.push results[1].slice(1) || '_'
            results = regex.exec arg
        names

    toRegexString: (arg) ->
        common.getNames(arg).forEach (name) ->
            arg = arg.replace(':' + name, '([^\/]+)')
        '^'  + arg.replace(/\*/g, '(.*)') + '$'
