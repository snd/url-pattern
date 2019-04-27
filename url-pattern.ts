//###############################################################################
// helpers

// source: http://stackoverflow.com/a/3561711
let escapeForRegex = string => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

let concatMap = function (array, f) {
  let results = [];
  let i = -1;
  let { length } = array;
  while (++i < length) {
    results = results.concat(f(array[i]));
  }
  return results;
};

let stringConcatMap = function (array, f) {
  let result = '';
  let i = -1;
  let { length } = array;
  while (++i < length) {
    result += f(array[i]);
  }
  return result;
};

// source: http://stackoverflow.com/a/16047223
let regexGroupCount = regex => new RegExp(regex.toString() + '|').exec('').length - 1;

let keysAndValuesToObject = function (keys, values) {
  let object = {};
  let i = -1;
  let { length } = keys;
  while (++i < length) {
    let key = keys[i];
    let value = values[i];
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
};

//###############################################################################
// parser combinators
// subset copied from
// https://github.com/snd/pcom/blob/master/src/pcom.coffee
// (where they are tested !)
// to keep this at zero dependencies and small filesize

let P = {};

P.Result = function (value, rest) {
  this.value = value;
  this.rest = rest;
};

P.Tagged = function (tag, value) {
  this.tag = tag;
  this.value = value;
};

P.tag = (tag, parser) => function (input) {
  let result = parser(input);
  if (result == null) {
    return;
  }
  let tagged = new P.Tagged(tag, result.value);
  return new P.Result(tagged, result.rest);
};

P.regex = regex =>
// unless regex instanceof RegExp
//   throw new Error 'argument must be instanceof RegExp'
function (input) {
  let matches = regex.exec(input);
  if (matches == null) {
    return;
  }
  let result = matches[0];
  return new P.Result(result, input.slice(result.length));
};

P.sequence = (...parsers) => function (input) {
  let i = -1;
  let { length } = parsers;
  let values = [];
  let rest = input;
  while (++i < length) {
    let parser = parsers[i];
    // unless 'function' is typeof parser
    //   throw new Error "parser passed at index `#{i}` into `sequence` is not of type `function` but of type `#{typeof parser}`"
    let result = parser(rest);
    if (result == null) {
      return;
    }
    values.push(result.value);
    ({ rest } = result);
  }
  return new P.Result(values, rest);
};

P.pick = (indexes, ...parsers) => function (input) {
  let result = P.sequence(...Array.from(parsers || []))(input);
  if (result == null) {
    return;
  }
  let array = result.value;
  result.value = array[indexes];
  // unless Array.isArray indexes
  //   result.value = array[indexes]
  // else
  //   result.value = []
  //   indexes.forEach (i) ->
  //     result.value.push array[i]
  return result;
};

P.string = function (string) {
  let { length } = string;
  // if length is 0
  //   throw new Error '`string` must not be blank'
  return function (input) {
    if (input.slice(0, length) === string) {
      return new P.Result(string, input.slice(length));
    }
  };
};

P.lazy = function (fn) {
  let cached = null;
  return function (input) {
    if (cached == null) {
      cached = fn();
    }
    return cached(input);
  };
};

P.baseMany = function (parser, end, stringResult, atLeastOneResultRequired, input) {
  let rest = input;
  let results = stringResult ? '' : [];
  while (true) {
    if (end != null) {
      let endResult = end(rest);
      if (endResult != null) {
        break;
      }
    }
    let parserResult = parser(rest);
    if (parserResult == null) {
      break;
    }
    if (stringResult) {
      results += parserResult.value;
    } else {
      results.push(parserResult.value);
    }
    ({ rest } = parserResult);
  }

  if (atLeastOneResultRequired && results.length === 0) {
    return;
  }

  return new P.Result(results, rest);
};

P.many1 = parser => input => P.baseMany(parser, null, false, true, input);

P.concatMany1Till = (parser, end) => input => P.baseMany(parser, end, true, true, input);

P.firstChoice = (...parsers) => function (input) {
  let i = -1;
  let { length } = parsers;
  while (++i < length) {
    let parser = parsers[i];
    // unless 'function' is typeof parser
    //   throw new Error "parser passed at index `#{i}` into `firstChoice` is not of type `function` but of type `#{typeof parser}`"
    let result = parser(input);
    if (result != null) {
      return result;
    }
  }
};

//###############################################################################
// url pattern parser
// copied from
// https://github.com/snd/pcom/blob/master/src/url-pattern-example.coffee

let newParser = function (options) {
  let U = {};

  U.wildcard = P.tag('wildcard', P.string(options.wildcardChar));

  U.optional = P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(() => U.pattern), P.string(options.optionalSegmentEndChar)));

  U.name = P.regex(new RegExp(`^[${ options.segmentNameCharset }]+`));

  U.named = P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(() => U.name)));

  U.escapedChar = P.pick(1, P.string(options.escapeChar), P.regex(/^./));

  U.static = P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(() => U.escapedChar), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), U.wildcard)));

  U.token = P.lazy(() => P.firstChoice(U.wildcard, U.optional, U.named, U.static));

  U.pattern = P.many1(P.lazy(() => U.token));

  return U;
};

//###############################################################################
// options

let defaultOptions = {
  escapeChar: '\\',
  segmentNameStartChar: ':',
  segmentValueCharset: 'a-zA-Z0-9-_~ %',
  segmentNameCharset: 'a-zA-Z0-9',
  optionalSegmentStartChar: '(',
  optionalSegmentEndChar: ')',
  wildcardChar: '*'
};

//###############################################################################
// functions that further process ASTs returned as `.value` in parser results

var baseAstNodeToRegexString = function (astNode, segmentValueCharset) {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, node => baseAstNodeToRegexString(node, segmentValueCharset));
  }

  switch (astNode.tag) {
    case 'wildcard':
      return '(.*?)';
    case 'named':
      return `([${ segmentValueCharset }]+)`;
    case 'static':
      return escapeForRegex(astNode.value);
    case 'optional':
      return `(?:${ baseAstNodeToRegexString(astNode.value, segmentValueCharset) })?`;
  }
};

let astNodeToRegexString = function (astNode, segmentValueCharset) {
  if (segmentValueCharset == null) {
    ({ segmentValueCharset } = defaultOptions);
  }
  return `^${ baseAstNodeToRegexString(astNode, segmentValueCharset) }$`;
};

var astNodeToNames = function (astNode) {
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
};

let getParam = function (params, key, nextIndexes, sideEffects) {
  if (sideEffects == null) {
    sideEffects = false;
  }
  let value = params[key];
  if (value == null) {
    if (sideEffects) {
      throw new Error(`no values provided for key \`${ key }\``);
    } else {
      return;
    }
  }
  let index = nextIndexes[key] || 0;
  let maxIndex = Array.isArray(value) ? value.length - 1 : 0;
  if (index > maxIndex) {
    if (sideEffects) {
      throw new Error(`too few values provided for key \`${ key }\``);
    } else {
      return;
    }
  }

  let result = Array.isArray(value) ? value[index] : value;

  if (sideEffects) {
    nextIndexes[key] = index + 1;
  }

  return result;
};

var astNodeContainsSegmentsForProvidedParams = function (astNode, params, nextIndexes) {
  if (Array.isArray(astNode)) {
    let i = -1;
    let { length } = astNode;
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
};

var stringify = function (astNode, params, nextIndexes) {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, node => stringify(node, params, nextIndexes));
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
};

//###############################################################################
// UrlPattern

var UrlPattern = function (arg1, arg2) {
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
      let groupCount = regexGroupCount(this.regex);
      if (arg2.length !== groupCount) {
        throw new Error(`regex contains ${ groupCount } groups but array of group names contains ${ arg2.length }`);
      }
      this.names = arg2;
    }
    return;
  }

  // string pattern

  if (arg1 === '') {
    throw new Error('argument must not be the empty string');
  }
  let withoutWhitespace = arg1.replace(/\s+/g, '');
  if (withoutWhitespace !== arg1) {
    throw new Error('argument must not contain whitespace');
  }

  let options = {
    escapeChar: (arg2 != null ? arg2.escapeChar : undefined) || defaultOptions.escapeChar,
    segmentNameStartChar: (arg2 != null ? arg2.segmentNameStartChar : undefined) || defaultOptions.segmentNameStartChar,
    segmentNameCharset: (arg2 != null ? arg2.segmentNameCharset : undefined) || defaultOptions.segmentNameCharset,
    segmentValueCharset: (arg2 != null ? arg2.segmentValueCharset : undefined) || defaultOptions.segmentValueCharset,
    optionalSegmentStartChar: (arg2 != null ? arg2.optionalSegmentStartChar : undefined) || defaultOptions.optionalSegmentStartChar,
    optionalSegmentEndChar: (arg2 != null ? arg2.optionalSegmentEndChar : undefined) || defaultOptions.optionalSegmentEndChar,
    wildcardChar: (arg2 != null ? arg2.wildcardChar : undefined) || defaultOptions.wildcardChar
  };

  let parser = newParser(options);
  let parsed = parser.pattern(arg1);
  if (parsed == null) {
    // TODO better error message
    throw new Error("couldn't parse pattern");
  }
  if (parsed.rest !== '') {
    // TODO better error message
    throw new Error("could only partially parse pattern");
  }
  this.ast = parsed.value;

  this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
  this.names = astNodeToNames(this.ast);
};

UrlPattern.prototype.match = function (url) {
  let match = this.regex.exec(url);
  if (match == null) {
    return null;
  }

  let groups = match.slice(1);
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
    throw new Error("argument must be an object or undefined");
  }
  return stringify(this.ast, params, {});
};

//###############################################################################
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
