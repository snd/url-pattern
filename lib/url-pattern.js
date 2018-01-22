(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.UrlPattern = factory());
}(this, (function () { 'use strict';

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// ############################################################################
// helpers
// source: http://stackoverflow.com/a/3561711
var escapeForRegex = function escapeForRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

function concatMap(array, f) {
  var results = [];
  var i = -1;
  var length = array.length;

  while (++i < length) {
    results = results.concat(f(array[i]));
  }
  return results;
}

function stringConcatMap(array, f) {
  var result = '';
  var i = -1;
  var length = array.length;

  while (++i < length) {
    result += f(array[i]);
  }
  return result;
}

// source: http://stackoverflow.com/a/16047223
var regexGroupCount = function regexGroupCount(regex) {
  return new RegExp(regex.toString() + '|').exec('').length - 1;
};

function keysAndValuesToObject(keys, values) {
  var object = {};
  var i = -1;
  var length = keys.length;

  while (++i < length) {
    var key = keys[i];
    var value = values[i];
    if (value == null) {
      continue;
    }
    // key already encountered
    if (object[key] != null) {
      // capture multiple values for same key in an array
      if (!Array.isArray(object[key])) {
        object[key] = [object[key]];
      }
      object[key].push(value);
    } else {
      object[key] = value;
    }
  }
  return object;
}

//#############################################################################
// parser combinators
// subset copied from
// https://github.com/snd/pcom/blob/master/src/pcom.coffee
// (where they are tested !)
// to keep this at zero dependencies and small filesize

var P = {};

P.Result = function (value, rest) {
  this.value = value;
  this.rest = rest;
};

P.Tagged = function (tag, value) {
  this.tag = tag;
  this.value = value;
};

P.tag = function (tag, parser) {
  return function (input) {
    var result = parser(input);
    if (result == null) {
      return;
    }
    var tagged = new P.Tagged(tag, result.value);
    return new P.Result(tagged, result.rest);
  };
};

P.regex = function (regex) {
  return (
    // unless regex instanceof RegExp
    //   throw new Error 'argument must be instanceof RegExp'
    function (input) {
      var matches = regex.exec(input);
      if (matches == null) {
        return;
      }
      var result = matches[0];
      return new P.Result(result, input.slice(result.length));
    }
  );
};

P.sequence = function () {
  for (var _len = arguments.length, parsers = Array(_len), _key = 0; _key < _len; _key++) {
    parsers[_key] = arguments[_key];
  }

  return function (input) {
    var i = -1;
    var length = parsers.length;

    var values = [];
    var rest = input;
    while (++i < length) {
      var parser = parsers[i];
      // unless 'function' is typeof parser
      //   throw new Error "parser passed at index `#{i}` into `sequence` is not of type `function` but of type `#{typeof parser}`"
      var result = parser(rest);
      if (result == null) {
        return;
      }
      values.push(result.value);
      rest = result.rest;
    }
    return new P.Result(values, rest);
  };
};

P.pick = function (indexes) {
  for (var _len2 = arguments.length, parsers = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    parsers[_key2 - 1] = arguments[_key2];
  }

  return function (input) {
    var result = P.sequence.apply(P, toConsumableArray(Array.from(parsers || [])))(input);
    if (result == null) {
      return;
    }
    var array = result.value;
    result.value = array[indexes];
    // unless Array.isArray indexes
    //   result.value = array[indexes]
    // else
    //   result.value = []
    //   indexes.forEach (i) ->
    //     result.value.push array[i]
    return result;
  };
};

P.string = function (string) {
  var length = string.length;
  // if length is 0
  //   throw new Error '`string` must not be blank'

  return function (input) {
    if (input.slice(0, length) === string) {
      return new P.Result(string, input.slice(length));
    }
  };
};

P.lazy = function (fn) {
  var cached = null;
  return function (input) {
    if (cached == null) {
      cached = fn();
    }
    return cached(input);
  };
};

P.baseMany = function (parser, end, stringResult, atLeastOneResultRequired, input) {
  var rest = input;
  var results = stringResult ? '' : [];
  while (true) {
    if (end != null) {
      var endResult = end(rest);
      if (endResult != null) {
        break;
      }
    }
    var parserResult = parser(rest);
    if (parserResult == null) {
      break;
    }
    if (stringResult) {
      results += parserResult.value;
    } else {
      results.push(parserResult.value);
    }
    rest = parserResult.rest;
  }

  if (atLeastOneResultRequired && results.length === 0) {
    return;
  }

  return new P.Result(results, rest);
};

P.many1 = function (parser) {
  return function (input) {
    return P.baseMany(parser, null, false, true, input);
  };
};

P.concatMany1Till = function (parser, end) {
  return function (input) {
    return P.baseMany(parser, end, true, true, input);
  };
};

P.firstChoice = function () {
  for (var _len3 = arguments.length, parsers = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
    parsers[_key3] = arguments[_key3];
  }

  return function (input) {
    var i = -1;
    var length = parsers.length;

    while (++i < length) {
      var parser = parsers[i];
      // unless 'function' is typeof parser
      //   throw new Error "parser passed at index `#{i}` into `firstChoice` is not of type `function` but of type `#{typeof parser}`"
      var result = parser(input);
      if (result != null) {
        return result;
      }
    }
  };
};

//#############################################################################
// url pattern parser
// copied from
// https://github.com/snd/pcom/blob/master/src/url-pattern-example.coffee

function newParser(options) {
  var U = {};

  U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));

  U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(function () {
    return U.pattern;
  }), P.string(options.optionalSegmentEndChar)));

  U.name = P.regex(new RegExp('^[' + options.segmentNameCharset + ']+'));

  U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(function () {
    return U.name;
  })));

  U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));

  U.static = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(function () {
    return U.escapedChar;
  }), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));

  U.token = P.lazy(function () {
    return P.firstChoice(U.wildcard, U.optional, U.named, U.static);
  });

  U.pattern = P.many1(P.lazy(function () {
    return U.token;
  }));

  return U;
}

//#############################################################################
// options

var defaultOptions = {
  escapeChar: '\\',
  segmentNameStartChar: ':',
  segmentValueCharset: 'a-zA-Z0-9-_~ %',
  segmentNameCharset: 'a-zA-Z0-9',
  optionalSegmentStartChar: '(',
  optionalSegmentEndChar: ')',
  wildcardChar: '*'

  //#############################################################################
  // functions that further process ASTs returned as `.value` in parser results

};function baseAstNodeToRegexString(astNode, segmentValueCharset) {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, function (node) {
      return baseAstNodeToRegexString(node, segmentValueCharset);
    });
  }

  switch (astNode.tag) {
    case 'wildcard':
      return '(.*?)';
    case 'named':
      return '([' + segmentValueCharset + ']+)';
    case 'static':
      return escapeForRegex(astNode.value);
    case 'optional':
      return '(?:' + baseAstNodeToRegexString(astNode.value, segmentValueCharset) + ')?';
  }
}

var astNodeToRegexString = function astNodeToRegexString(astNode) {
  var segmentValueCharset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultOptions.segmentValueCharset;
  return '^' + baseAstNodeToRegexString(astNode, segmentValueCharset) + '$';
};

function astNodeToNames(astNode) {
  if (Array.isArray(astNode)) {
    return concatMap(astNode, astNodeToNames);
  }

  switch (astNode.tag) {
    case 'wildcard':
      return ['_'];
    case 'named':
      return [astNode.value];
    case 'static':
      return [];
    case 'optional':
      return astNodeToNames(astNode.value);
  }
}

function getParam(params, key, nextIndexes) {
  var sideEffects = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;

  var value = params[key];
  if (value == null) {
    if (sideEffects) {
      throw new Error('no values provided for key `' + key + '`');
    } else {
      return;
    }
  }
  var index = nextIndexes[key] || 0;
  var maxIndex = Array.isArray(value) ? value.length - 1 : 0;
  if (index > maxIndex) {
    if (sideEffects) {
      throw new Error('too few values provided for key `' + key + '`');
    } else {
      return;
    }
  }

  var result = Array.isArray(value) ? value[index] : value;

  if (sideEffects) {
    nextIndexes[key] = index + 1;
  }

  return result;
}

function astNodeContainsSegmentsForProvidedParams(astNode, params, nextIndexes) {
  if (Array.isArray(astNode)) {
    var i = -1;
    var length = astNode.length;

    while (++i < length) {
      if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
        return true;
      }
    }
    return false;
  }

  switch (astNode.tag) {
    case 'wildcard':
      return getParam(params, '_', nextIndexes, false) != null;
    case 'named':
      return getParam(params, astNode.value, nextIndexes, false) != null;
    case 'static':
      return false;
    case 'optional':
      return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
  }
}

function stringify(astNode, params, nextIndexes) {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, function (node) {
      return stringify(node, params, nextIndexes);
    });
  }

  switch (astNode.tag) {
    case 'wildcard':
      return getParam(params, '_', nextIndexes, true);
    case 'named':
      return getParam(params, astNode.value, nextIndexes, true);
    case 'static':
      return astNode.value;
    case 'optional':
      if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
        return stringify(astNode.value, params, nextIndexes);
      } else {
        return '';
      }
  }
}

//#############################################################################
// UrlPattern

function UrlPattern(arg1, arg2) {
  // self awareness
  if (arg1 instanceof UrlPattern) {
    this.isRegex = arg1.isRegex;
    this.regex = arg1.regex;
    this.ast = arg1.ast;
    this.names = arg1.names;
    return;
  }

  this.isRegex = arg1 instanceof RegExp;

  if ('string' !== typeof arg1 && !this.isRegex) {
    throw new TypeError('argument must be a regex or a string');
  }

  // regex

  if (this.isRegex) {
    this.regex = arg1;
    if (arg2 != null) {
      if (!Array.isArray(arg2)) {
        throw new Error('if first argument is a regex the second argument may be an array of group names but you provided something else');
      }
      var groupCount = regexGroupCount(this.regex);
      if (arg2.length !== groupCount) {
        throw new Error('regex contains ' + groupCount + ' groups but array of group names contains ' + arg2.length);
      }
      this.names = arg2;
    }
    return;
  }

  // string pattern

  if (arg1 === '') {
    throw new Error('argument must not be the empty string');
  }
  var withoutWhitespace = arg1.replace(/\s+/g, '');
  if (withoutWhitespace !== arg1) {
    throw new Error('argument must not contain whitespace');
  }

  var options = {
    escapeChar: (arg2 != null ? arg2.escapeChar : undefined) || defaultOptions.escapeChar,
    segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : undefined) || defaultOptions.segmentNameStartChar,
    segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : undefined) || defaultOptions.segmentNameCharset,
    segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : undefined) || defaultOptions.segmentValueCharset,
    optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : undefined) || defaultOptions.optionalSegmentStartChar,
    optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : undefined) || defaultOptions.optionalSegmentEndChar,
    wildcardChar: (arg2 != null ? arg2.wildcardChar : undefined) || defaultOptions.wildcardChar
  };

  var parser = newParser(options);
  var parsed = parser.pattern(arg1);
  if (parsed == null) {
    // TODO better error message
    throw new Error("couldn't parse pattern");
  }
  if (parsed.rest !== '') {
    // TODO better error message
    throw new Error('could only partially parse pattern');
  }
  this.ast = parsed.value;

  this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
  this.names = astNodeToNames(this.ast);
}

UrlPattern.prototype.match = function (url) {
  var match = this.regex.exec(url);
  if (match == null) {
    return null;
  }

  var groups = match.slice(1);
  if (this.names) {
    return keysAndValuesToObject(this.names, groups);
  } else {
    return groups;
  }
};

UrlPattern.prototype.stringify = function (params) {
  if (params == null) {
    params = {};
  }
  if (this.isRegex) {
    throw new Error("can't stringify patterns generated from a regex");
  }
  if (params !== Object(params)) {
    throw new Error('argument must be an object or undefined');
  }
  return stringify(this.ast, params, {});
};

//#############################################################################
// exports

// helpers
UrlPattern.escapeForRegex = escapeForRegex;
UrlPattern.concatMap = concatMap;
UrlPattern.stringConcatMap = stringConcatMap;
UrlPattern.regexGroupCount = regexGroupCount;
UrlPattern.keysAndValuesToObject = keysAndValuesToObject;

// parsers
UrlPattern.P = P;
UrlPattern.newParser = newParser;
UrlPattern.defaultOptions = defaultOptions;

// ast
UrlPattern.astNodeToRegexString = astNodeToRegexString;
UrlPattern.astNodeToNames = astNodeToNames;
UrlPattern.getParam = getParam;
UrlPattern.astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
UrlPattern.stringify = stringify;

return UrlPattern;

})));
