// OPTIONS

interface UrlPatternOptions {
  escapeChar?: string;
  segmentNameStartChar?: string;
  segmentValueCharset?: string;
  segmentNameCharset?: string;
  optionalSegmentStartChar?: string;
  optionalSegmentEndChar?: string;
  wildcardChar?: string;
}

const defaultOptions: UrlPatternOptions = {
  escapeChar: '\\',
  segmentNameStartChar: ':',
  segmentValueCharset: 'a-zA-Z0-9-_~ %',
  segmentNameCharset: 'a-zA-Z0-9',
  optionalSegmentStartChar: '(',
  optionalSegmentEndChar: ')',
  wildcardChar: '*'
};

// HELPERS

// escapes a string for insertion into a regular expression
// source: http://stackoverflow.com/a/3561711
function escapeStringForRegex(string: string) : string {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

function concatMap<T>(array: Array<T>, f: (T) => Array<T>) : Array<T> {
  let results: Array<T> = [];
  array.forEach(function(value) {
    results = results.concat(f(value));
  });
  return results;
}

function stringConcatMap<T>(array: Array<T>, f: (T) => string) : string {
  let result = '';
  array.forEach(function(value) {
    result += f(value);
  });
  return result;
};

// returns the number of groups in the `regex`.
// source: http://stackoverflow.com/a/16047223
function regexGroupCount(regex: RegExp) : number {
  return new RegExp(regex.toString() + "|").exec("").length - 1;
}

// zips an array of `keys` and an array of `values` into an object.
// `keys` and `values` must have the same length.
// if the same key appears multiple times the associated values are collected in an array.
function keysAndValuesToObject(keys: Array<any>, values: Array<any>) : Object {
  let result = {};

  if (keys.length !== values.length) {
    throw Error("keys.length must equal values.length");
  }

  let i = -1;
  let { length } = keys;
  while (++i < keys.length) {
    let key = keys[i];
    let value = values[i];

    if (value == null) {
      continue;
    }

    // key already encountered
    if (result[key] != null) {
      // capture multiple values for same key in an array
      if (!Array.isArray(result[key])) {
        result[key] = [result[key]];
      }
      result[key].push(value);
    } else {
      result[key] = value;
    }
  }
  return result;
};

// PARSER COMBINATORS

// parse result
class Result<Value> {
  // parsed value
  value: Value;
  // unparsed rest
  readonly rest: string;
  constructor(value: Value, rest: string) {
    this.value = value;
    this.rest = rest;
  }
}

class Tagged<Value> {
  readonly tag: string;
  readonly value: Value;
  constructor(tag: string, value: Value) {
    this.tag = tag;
    this.value = value;
  }
}

// a parser is a function that takes a string and returns a `Result` containing a parsed `Result.value` and the rest of the string `Result.rest`
type Parser<T> = (string) => Result<T> | null;

// parser combinators
let P = {
  Result: Result,
  Tagged: Tagged,
  // transforms a `parser` into a parser that tags its `Result.value` with `tag`
  tag<T>(tag: string, parser: Parser<T>) : Parser<Tagged<T>> {
    return function(input: string): Result<Tagged<T>> | null {
      let result = parser(input);
      if (result == null) {
        return null;
      }
      let tagged = new Tagged(tag, result.value);
      return new Result(tagged, result.rest);
    }
  },
  // parser that consumes everything matched by `regex`
  regex(regex: RegExp) : Parser<string> {
    return function(input: string): Result<string> | null {
      let matches = regex.exec(input);
      if (matches == null) {
        return null;
      }
      let result = matches[0];
      return new Result(result, input.slice(result.length));
    }
  },
  // takes a sequence of parsers and returns a parser that runs
  // them in sequence and produces an array of their results
  sequence(...parsers: Array<Parser<any>>) : Parser<Array<any>> {
    return function(input: string): Result<Array<any>> | null {
      let rest = input;
      let values = [];
      parsers.forEach(function(parser) {
        let result = parser(rest);
        if (result == null) {
          return null;
        }
        values.push(result.value);
        rest = result.rest;
      });
      return new Result(values, rest);
    }
  },
  // returns a parser that consumes `str` exactly
  string(str: string) : Parser<string> {
    let { length } = str;
    return function(input: string) : Result<string> | null {
      if (input.slice(0, length) === str) {
        return new Result(str, input.slice(length));
      }
    };
  },
  // takes a sequence of parser and only returns the result
  // returned by the `index`th parser
  pick(index, ...parsers: Array<Parser<any>>) : Parser<any> {
    let parser = P.sequence(...parsers);
    return function(input: string) : Result<any> | null {
      let result = parser(input);
      if (result == null) {
        return null;
      }
      let values = result.value;
      result.value = values[index];
      return result;
    }
  },
  // for parsers that each depend on one another (cyclic dependencies)
  // postpone lookup to when they both exist.
  lazy<T>(get_parser: () => Parser<T>): Parser<T> {
    let cached_parser = null;
    return function (input: string): Result<T> | null {
      if (cached_parser == null) {
        cached_parser = get_parser();
      }
      return cached_parser(input);
    };
  },
  // base function for parsers that parse multiples
  baseMany<T>(
    parser: Parser<T>,
    // once the `endParser` (if not null) consumes the `baseMany` parser returns.
    // the result of the `endParser` is ignored
    endParser: Parser<any> | null,
    isAtLeastOneResultRequired: boolean,
    input: string
  ) : Result<Array<T>> | null {
    let rest = input;
    let results: Array<T> = [];
    while (true) {
      if (endParser != null) {
        let endResult = endParser(rest);
        if (endResult != null) {
          break;
        }
      }
      let parserResult = parser(rest);
      if (parserResult == null) {
        break;
      }
      results.push(parserResult.value);
      rest = parserResult.rest;
    }

    if (isAtLeastOneResultRequired && results.length === 0) {
      return null;
    }

    return new Result(results, rest);
  },
  many1<T>(parser: Parser<T>) : Parser<Array<T>> {
    return function(input: string) : Result<Array<T>> {
      const endParser = null;
      const isAtLeastOneResultRequired = true;
      return P.baseMany(parser, endParser, isAtLeastOneResultRequired, input);
    }
  },
  concatMany1Till(parser: Parser<string>, endParser: Parser<any>) : Parser<string> {
    return function(input: string) : Result<string> | null {
      const isAtLeastOneResultRequired = true;
      let result = P.baseMany(parser, endParser, isAtLeastOneResultRequired, input);
      if (result == null) {
        return null;
      }
      return new Result(result.value.join(""), result.rest);
    }
  },
  // takes a sequence of parsers. returns the result from the first
  // parser that consumes the input.
  firstChoice(...parsers: Array<Parser<any>>) : Parser<any> {
    return function(input: string) : Result<any> | null {
      parsers.forEach(function(parser) {
        let result = parser(input);
        if (result != null) {
          return result;
        }
      });
      return null;
    }
  }
}

// URL PATTERN PARSER

interface UrlPatternParser {
  wildcard: Parser<Tagged<string>>,
  optional: Parser<Tagged<any>>,
  name: Parser<string>,
  named: Parser<Tagged<any>>,
  escapedChar: Parser<any>,
  pattern: Parser<any>,
}

function newUrlPatternParser(options: UrlPatternOptions) : UrlPatternParser {
  let U = {
    wildcard: P.tag('wildcard', P.string(options.wildcardChar)),
    optional: P.tag('optional', P.pick(1, P.string(options.optionalSegmentStartChar), P.lazy(() => U.pattern), P.string(options.optionalSegmentEndChar))),
    name: P.regex(new RegExp(`^[${ options.segmentNameCharset }]+`)),
    named: P.tag('named', P.pick(1, P.string(options.segmentNameStartChar), P.lazy(() => U.name))),
    escapedChar: P.pick(1, P.string(options.escapeChar), P.regex(/^./)),
    static: P.tag('static', P.concatMany1Till(P.firstChoice(P.lazy(() => U.escapedChar), P.regex(/^./)), P.firstChoice(P.string(options.segmentNameStartChar), P.string(options.optionalSegmentStartChar), P.string(options.optionalSegmentEndChar), P.lazy(() => U.wildcard)))),
    token: P.lazy(() => P.firstChoice(U.wildcard, U.optional, U.named, U.static)),
    pattern: P.many1(P.lazy(() => U.token)),
  }

  return U;
};

// functions that further process ASTs returned as `.value` in parser results

function baseAstNodeToRegexString(astNode, segmentValueCharset) {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, node => baseAstNodeToRegexString(node, segmentValueCharset));
  }

  switch (astNode.tag) {
    case 'wildcard':
      return '(.*?)';
    case 'named':
      return `([${ segmentValueCharset }]+)`;
    case 'static':
      return escapeStringForRegex(astNode.value);
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

function getParam(params, key, nextIndexes, sideEffects) {
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

function stringify(astNode, params, nextIndexes) {
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

class UrlPattern {
  readonly isRegex: boolean;
  readonly regex: RegExp;
  readonly ast: Object;
  readonly names: Array<String>;

  constructor(pattern: string, options?: UrlPatternOptions);
  constructor(pattern: RegExp, groupNames?: Array<string>);

  constructor(pattern: string | RegExp | UrlPattern, optionsOrGroupNames?: UrlPatternOptions | Array<string>) {
    // self awareness
    if (pattern instanceof UrlPattern) {
      this.isRegex = pattern.isRegex;
      this.regex = pattern.regex;
      this.ast = pattern.ast;
      this.names = pattern.names;
      return;
    }

    this.isRegex = pattern instanceof RegExp;

    if ("string" !== typeof pattern && !this.isRegex) {
      throw new TypeError("first argument must be a RegExp, a string or an instance of UrlPattern");
    }

    // handle regex pattern and return early
    if (pattern instanceof RegExp) {
      this.regex = pattern;
      if (optionsOrGroupNames != null) {
        if (!Array.isArray(optionsOrGroupNames)) {
          throw new TypeError("if first argument is a RegExp the second argument may be an Array<String> of group names but you provided something else");
        }
        let groupCount = regexGroupCount(this.regex);
        if (optionsOrGroupNames.length !== groupCount) {
          throw new Error(`regex contains ${ groupCount } groups but array of group names contains ${ optionsOrGroupNames.length }`);
        }
        this.names = optionsOrGroupNames;
      }
      return;
    }

    // everything following only concerns string patterns

    if (pattern === '') {
      throw new Error('first argument must not be the empty string');
    }
    let patternWithoutWhitespace = pattern.replace(/\s+/g, "");
    if (patternWithoutWhitespace !== pattern) {
      throw new Error("first argument must not contain whitespace");
    }

    if (Array.isArray(optionsOrGroupNames)) {
      throw new Error("if first argument is a string second argument must be an options object or undefined");
    }

    let options: UrlPatternOptions = {
      escapeChar: (typeof optionsOrGroupNames != null ? optionsOrGroupNames.escapeChar : undefined) || defaultOptions.escapeChar,
      segmentNameStartChar: (optionsOrGroupNames != null ? optionsOrGroupNames.segmentNameStartChar : undefined) || defaultOptions.segmentNameStartChar,
      segmentNameCharset: (optionsOrGroupNames != null ? optionsOrGroupNames.segmentNameCharset : undefined) || defaultOptions.segmentNameCharset,
      segmentValueCharset: (optionsOrGroupNames != null ? optionsOrGroupNames.segmentValueCharset : undefined) || defaultOptions.segmentValueCharset,
      optionalSegmentStartChar: (optionsOrGroupNames != null ? optionsOrGroupNames.optionalSegmentStartChar : undefined) || defaultOptions.optionalSegmentStartChar,
      optionalSegmentEndChar: (optionsOrGroupNames != null ? optionsOrGroupNames.optionalSegmentEndChar : undefined) || defaultOptions.optionalSegmentEndChar,
      wildcardChar: (optionsOrGroupNames != null ? optionsOrGroupNames.wildcardChar : undefined) || defaultOptions.wildcardChar
    };

    let parser: UrlPatternParser = newUrlPatternParser(options);
    let parsed = parser.pattern(pattern);
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

  }

  match(url: string): Object {
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
  }

  stringify(params?: Object): string {
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
  }

  // make helpers available directly on UrlPattern
  static escapeStringForRegex = escapeStringForRegex;
  static concatMap = concatMap;
  static stringConcatMap = stringConcatMap;
  static regexGroupCount = regexGroupCount;
  static keysAndValuesToObject = keysAndValuesToObject;

  // make AST helpers available directly on UrlPattern
  static astNodeToRegexString = astNodeToRegexString;
  static astNodeToNames = astNodeToNames;
  static getParam = getParam;
  static astNodeContainsSegmentsForProvidedParams = astNodeContainsSegmentsForProvidedParams;
  static stringify = stringify;

  // make parsers available directly on UrlPattern
  static P = P;
  static newUrlPatternParser = newUrlPatternParser;
  static defaultOptions = defaultOptions;
}

// export only the UrlPattern class
export = UrlPattern;
