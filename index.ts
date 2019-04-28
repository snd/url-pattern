// OPTIONS

interface IUrlPatternOptions {
  escapeChar?: string;
  segmentNameStartChar?: string;
  segmentValueCharset?: string;
  segmentNameCharset?: string;
  optionalSegmentStartChar?: string;
  optionalSegmentEndChar?: string;
  wildcardChar?: string;
}

export const defaultOptions: IUrlPatternOptions = {
  escapeChar: "\\",
  optionalSegmentEndChar: ")",
  optionalSegmentStartChar: "(",
  segmentNameCharset: "a-zA-Z0-9",
  segmentNameStartChar: ":",
  segmentValueCharset: "a-zA-Z0-9-_~ %",
  wildcardChar: "*",
};

// HELPERS

// escapes a string for insertion into a regular expression
// source: http://stackoverflow.com/a/3561711
export function escapeStringForRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export function concatMap<T>(array: T[], f: (x: T) => T[]): T[] {
  let results: T[] = [];
  array.forEach((value) => {
    results = results.concat(f(value));
  });
  return results;
}

export function stringConcatMap<T>(array: T[], f: (x: T) => string): string {
  let result = "";
  array.forEach((value) => {
    result += f(value);
  });
  return result;
}

/*
 * returns the number of groups in the `regex`.
 * source: http://stackoverflow.com/a/16047223
 */
export function regexGroupCount(regex: RegExp): number {
  return new RegExp(regex.toString() + "|").exec("").length - 1;
}

// zips an array of `keys` and an array of `values` into an object.
// `keys` and `values` must have the same length.
// if the same key appears multiple times the associated values are collected in an array.
export function keysAndValuesToObject(keys: any[], values: any[]): object {
  const result: object = {};

  if (keys.length !== values.length) {
    throw Error("keys.length must equal values.length");
  }

  let i = -1;
  const { length } = keys;
  while (++i < keys.length) {
    const key = keys[i];
    const value = values[i];

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
}

// PARSER COMBINATORS

// parse result
class Result<Value> {
  /* parsed value */
  public readonly value: Value;
  /* unparsed rest */
  public readonly rest: string;
  constructor(value: Value, rest: string) {
    this.value = value;
    this.rest = rest;
  }
}

class Tagged<Value> {
  public readonly tag: string;
  public readonly value: Value;
  constructor(tag: string, value: Value) {
    this.tag = tag;
    this.value = value;
  }
}

/**
 * a parser is a function that takes a string and returns a `Result`
 * containing a parsed `Result.value` and the rest of the string `Result.rest`
 */
type Parser<T> = (str: string) => Result<T> | undefined;

// parser combinators
let P = {
  Result,
  Tagged,
  // transforms a `parser` into a parser that tags its `Result.value` with `tag`
  tag<T>(tag: string, parser: Parser<T>): Parser<Tagged<T>> {
    return (input: string) => {
      const result = parser(input);
      if (result == null) {
        return;
      }
      const tagged = new Tagged(tag, result.value);
      return new Result(tagged, result.rest);
    };
  },
  // parser that consumes everything matched by `regex`
  regex(regex: RegExp): Parser<string> {
    return (input: string) => {
      const matches = regex.exec(input);
      if (matches == null) {
        return;
      }
      const result = matches[0];
      return new Result(result, input.slice(result.length));
    };
  },
  // takes a sequence of parsers and returns a parser that runs
  // them in sequence and produces an array of their results
  sequence(...parsers: Array<Parser<any>>): Parser<any[]> {
    return (input: string) => {
      let rest = input;
      const values: any[] = [];
      parsers.forEach((parser: Parser<any>) => {
        const result = parser(rest);
        if (result == null) {
          return;
        }
        values.push(result.value);
        rest = result.rest;
      });
      return new Result(values, rest);
    };
  },
  // returns a parser that consumes `str` exactly
  string(str: string): Parser<string> {
    const { length } = str;
    return (input: string) => {
      if (input.slice(0, length) === str) {
        return new Result(str, input.slice(length));
      }
    };
  },
  // takes a sequence of parser and only returns the result
  // returned by the `index`th parser
  pick(index: number, ...parsers: Array<Parser<any>>): Parser<any> {
    const parser = P.sequence(...parsers);
    return (input: string) => {
      const result = parser(input);
      if (result == null) {
        return;
      }
      return new Result(result.value[index], result.rest);
    };
  },
  // for parsers that each depend on one another (cyclic dependencies)
  // postpone lookup to when they both exist.
  lazy<T>(getParser: () => Parser<T>): Parser<T> {
    let cachedParser: Parser<T> | null = null;
    return (input: string) => {
      if (cachedParser == null) {
        cachedParser = getParser();
      }
      return cachedParser(input);
    };
  },
  /*
   * base function for parsers that parse multiples.
   *
   * @param endParser  once the `endParser` (if not null) consumes
   * the `baseMany` parser returns. the result of the `endParser` is ignored.
   */
  baseMany<T>(
    parser: Parser<T>,
    endParser: Parser<any> | null,
    isAtLeastOneResultRequired: boolean,
    input: string,
  ): Result<T[]> | undefined {
    let rest = input;
    const results: T[] = [];
    while (true) {
      if (endParser != null) {
        const endResult = endParser(rest);
        if (endResult != null) {
          break;
        }
      }
      const parserResult = parser(rest);
      if (parserResult == null) {
        break;
      }
      results.push(parserResult.value);
      rest = parserResult.rest;
    }

    if (isAtLeastOneResultRequired && results.length === 0) {
      return;
    }

    return new Result(results, rest);
  },
  many1<T>(parser: Parser<T>): Parser<T[]> {
    return (input: string) => {
      const endParser: null = null;
      const isAtLeastOneResultRequired = true;
      return P.baseMany(parser, endParser, isAtLeastOneResultRequired, input);
    };
  },
  concatMany1Till(parser: Parser<string>, endParser: Parser<any>): Parser<string> {
    return (input: string) => {
      const isAtLeastOneResultRequired = true;
      const result = P.baseMany(parser, endParser, isAtLeastOneResultRequired, input);
      if (result == null) {
        return;
      }
      return new Result(result.value.join(""), result.rest);
    };
  },
  // takes a sequence of parsers. returns the result from the first
  // parser that consumes the input.
  firstChoice(...parsers: Array<Parser<any>>): Parser<any> {
    return (input: string) => {
      for (const parser of parsers) {
        const result = parser(input);
        if (result != null) {
          return result;
        }
      }
      return;
    };
  },
};

// URL PATTERN PARSER

interface IUrlPatternParser {
  escapedChar: Parser<any>;
  name: Parser<string>;
  named: Parser<Tagged<any>>;
  optional: Parser<Tagged<any>>;
  pattern: Parser<any>;
  static: Parser<Tagged<string>>;
  token: Parser<any>;
  wildcard: Parser<Tagged<string>>;
}

export function newUrlPatternParser(options: IUrlPatternOptions): IUrlPatternParser {
  const U: IUrlPatternParser = {
    escapedChar: P.pick(1, P.string(options.escapeChar), P.regex(/^./)),
    name: P.regex(new RegExp(`^[${ options.segmentNameCharset }]+`)),
    named: P.tag("named", P.pick(1, P.string(options.segmentNameStartChar), P.lazy(() => U.name))),
    optional: P.tag("optional", P.pick(1,
      P.string(options.optionalSegmentStartChar),
      P.lazy(() => U.pattern),
      P.string(options.optionalSegmentEndChar))),
    pattern: P.many1(P.lazy(() => U.token)),
    static: P.tag("static", P.concatMany1Till(P.firstChoice(
      P.lazy(() => U.escapedChar),
      P.regex(/^./)),
      P.firstChoice(
        P.string(options.segmentNameStartChar),
        P.string(options.optionalSegmentStartChar),
        P.string(options.optionalSegmentEndChar),
        P.lazy(() => U.wildcard)))),
    token: P.lazy(() => P.firstChoice(U.wildcard, U.optional, U.named, U.static)),
    wildcard: P.tag("wildcard", P.string(options.wildcardChar)),
  };

  return U;
}

// functions that further process ASTs returned as `.value` in parser results

function baseAstNodeToRegexString(astNode: Tagged<any>, segmentValueCharset: string): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => baseAstNodeToRegexString(node, segmentValueCharset));
  }

  switch (astNode.tag) {
    case "wildcard":
      return "(.*?)";
    case "named":
      return `([${ segmentValueCharset }]+)`;
    case "static":
      return escapeStringForRegex(astNode.value);
    case "optional":
      return `(?:${ baseAstNodeToRegexString(astNode.value, segmentValueCharset) })?`;
  }
}

function astNodeToRegexString(astNode: Tagged<any>, segmentValueCharset?: string) {
  if (segmentValueCharset == null) {
    ({ segmentValueCharset } = defaultOptions);
  }
  return `^${ baseAstNodeToRegexString(astNode, segmentValueCharset) }$`;
}

function astNodeToNames(astNode: Tagged<any> | Array<Tagged<any>>): string[] {
  if (Array.isArray(astNode)) {
    return concatMap(astNode, astNodeToNames);
  }

  switch (astNode.tag) {
    case "wildcard":
      return ["_"];
    case "named":
      return [astNode.value];
    case "static":
      return [];
    case "optional":
      return astNodeToNames(astNode.value);
  }
}

// TODO better name
export function getParam(params, key, nextIndexes, sideEffects) {
  if (sideEffects == null) {
    sideEffects = false;
  }
  const value = params[key];
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

function astNodeContainsSegmentsForProvidedParams(astNode, params, nextIndexes) {
  if (Array.isArray(astNode)) {
    let i = -1;
    const { length } = astNode;
    while (++i < length) {
      if (astNodeContainsSegmentsForProvidedParams(astNode[i], params, nextIndexes)) {
        return true;
      }
    }
    return false;
  }

  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, false) != null;
    case "named":
      return getParam(params, astNode.value, nextIndexes, false) != null;
    case "static":
      return false;
    case "optional":
      return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
  }
}

function stringify(astNode: Tagged<any>, params, nextIndexes): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, node => stringify(node, params, nextIndexes));
  }

  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, true);
    case "named":
      return getParam(params, astNode.value, nextIndexes, true);
    case "static":
      return astNode.value;
    case "optional":
      if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
        return stringify(astNode.value, params, nextIndexes);
      } else {
        return ""
      }
  }
}

export class UrlPattern {
  public readonly isRegex: boolean;
  public readonly regex: RegExp;
  public readonly ast: Tagged<any>;
  public readonly names: string[];

  constructor(pattern: string, options?: IUrlPatternOptions);
  constructor(pattern: RegExp, groupNames?: string[]);

  constructor(pattern: string | RegExp | UrlPattern, optionsOrGroupNames?: IUrlPatternOptions | string[]) {
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
          throw new TypeError(
            "if first argument is a RegExp the second argument may be an Array<String> of group names but you provided something else");
        }
        const groupCount = regexGroupCount(this.regex);
        if (optionsOrGroupNames.length !== groupCount) {
          throw new Error(`regex contains ${ groupCount } groups but array of group names contains ${ optionsOrGroupNames.length }`);
        }
        this.names = optionsOrGroupNames;
      }
      return;
    }

    // everything following only concerns string patterns

    if (pattern === "") {
      throw new Error("first argument must not be the empty string");
    }
    const patternWithoutWhitespace = pattern.replace(/\s+/g, "");
    if (patternWithoutWhitespace !== pattern) {
      throw new Error("first argument must not contain whitespace");
    }

    if (Array.isArray(optionsOrGroupNames)) {
      throw new Error("if first argument is a string second argument must be an options object or undefined");
    }

    const options: IUrlPatternOptions = {
      escapeChar: (typeof optionsOrGroupNames != null ?
        optionsOrGroupNames.escapeChar : undefined) || defaultOptions.escapeChar,
      optionalSegmentEndChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.optionalSegmentEndChar : undefined) || defaultOptions.optionalSegmentEndChar,
      optionalSegmentStartChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.optionalSegmentStartChar : undefined) || defaultOptions.optionalSegmentStartChar,
      segmentNameCharset: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentNameCharset : undefined) || defaultOptions.segmentNameCharset,
      segmentNameStartChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentNameStartChar : undefined) || defaultOptions.segmentNameStartChar,
      segmentValueCharset: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentValueCharset : undefined) || defaultOptions.segmentValueCharset,
      wildcardChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.wildcardChar : undefined) || defaultOptions.wildcardChar,
    };

    const parser: IUrlPatternParser = newUrlPatternParser(options);
    const parsed = parser.pattern(pattern);
    if (parsed == null) {
      // TODO better error message
      throw new Error("couldn't parse pattern");
    }
    if (parsed.rest !== "") {
      // TODO better error message
      throw new Error("could only partially parse pattern");
    }
    this.ast = parsed.value;

    this.regex = new RegExp(astNodeToRegexString(this.ast, options.segmentValueCharset));
    this.names = astNodeToNames(this.ast);
  }

  public match(url: string): object | undefined {
    const match = this.regex.exec(url);
    if (match == null) {
      return;
    }

    const groups = match.slice(1);
    if (this.names) {
      return keysAndValuesToObject(this.names, groups);
    } else {
      return groups;
    }
  }

  public stringify(params?: object): string {
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
