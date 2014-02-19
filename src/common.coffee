module.exports = common =

    getNames: (arg) ->
        return [] if arg instanceof RegExp
        regex = /((:?:[^\/]+)|(?:[\*]))/g

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

    toRegexString: (arg) ->
        common.getNames(arg).forEach (name) ->
            arg = arg.replace(':' + name, '([^\/]+)')
        '^'  + arg.replace(/\*/g, '(.*)') + '$'
