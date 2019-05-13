import {
  indexOfDuplicateElement,
  regexGroupCount,
} from "./helpers";

import {
  Ast,
} from "./parser-combinators";

import {
  defaultOptions,
  IOptions,
  IUserInputOptions,
} from "./options";

import {
  newUrlPatternParser,
} from "./parser";

import {
  astRootToRegexString,
  astToNames,
  stringify,
} from "./ast-helpers";

export default class UrlPattern {
  public readonly isRegex: boolean;
  public readonly regex: RegExp;
  public readonly ast?: Array<Ast<any>>;
  public readonly names?: string[];

  constructor(pattern: string, options?: IUserInputOptions);
  constructor(pattern: RegExp, groupNames?: string[]);
  constructor(pattern: UrlPattern);

  constructor(pattern: string | RegExp | UrlPattern, optionsOrGroupNames?: IUserInputOptions | string[]) {
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
          throw new TypeError([
            "if first argument is a RegExp the second argument",
            "may be an Array<String> of group names",
            "but you provided something else",
          ].join(" "));
        }
        const groupCount = regexGroupCount(this.regex);
        if (optionsOrGroupNames.length !== groupCount) {
          throw new Error([
            `regex contains ${ groupCount } groups`,
            `but array of group names contains ${ optionsOrGroupNames.length }`,
          ].join(" "));
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

    const options: IOptions = {
      escapeChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.escapeChar : undefined) || defaultOptions.escapeChar,
      optionalSegmentEndChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.optionalSegmentEndChar : undefined) || defaultOptions.optionalSegmentEndChar,
      optionalSegmentStartChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.optionalSegmentStartChar : undefined) || defaultOptions.optionalSegmentStartChar,
      segmentNameCharset: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentNameCharset : undefined) || defaultOptions.segmentNameCharset,
      segmentNameEndChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentNameEndChar : undefined),
      segmentNameStartChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentNameStartChar : undefined) || defaultOptions.segmentNameStartChar,
      segmentValueCharset: (optionsOrGroupNames != null ?
        optionsOrGroupNames.segmentValueCharset : undefined) || defaultOptions.segmentValueCharset,
      wildcardChar: (optionsOrGroupNames != null ?
        optionsOrGroupNames.wildcardChar : undefined) || defaultOptions.wildcardChar,
    };

    const parser = newUrlPatternParser(options);
    const parsed = parser(pattern);
    if (parsed == null) {
      throw new Error("couldn't parse pattern");
    }
    if (parsed.rest.length !== 0) {
      const failureIndex = pattern.length - parsed.rest.length;
      throw new Error([
        `could only partially parse pattern.`,
        `failure at character ${ failureIndex + 1} in pattern:`,
        pattern,
        " ".repeat(failureIndex) + "^ parsing failed here",
      ].join("\n"));
    }
    const ast = parsed.value;
    this.ast = ast;

    this.regex = new RegExp(astRootToRegexString(ast, options.segmentValueCharset));
    this.names = astToNames(ast);
    const index = indexOfDuplicateElement(this.names);
    if (index !== -1) {
      throw new Error(
        `duplicate name "${ this.names[index] }" in pattern. names must be unique`,
      );
    }
  }

  public match(url: string): { [index: string]: string } | string[] | undefined {
    const match = this.regex.exec(url);
    if (match == null) {
      return;
    }

    const groups = match.slice(1);
    if (this.names != null) {
      const result: { [index: string]: string } = {};
      for (let i = 0; i < this.names.length; i++) {
        if (groups[i] != null) {
          result[this.names[i]] = groups[i];
        }
      }
      return result;
    } else {
      return groups;
    }
  }

  public stringify(params?: object): string {
    if (params == null) {
      params = {};
    }
    if (this.ast == null) {
      throw new Error("can't stringify patterns generated from a regex");
    }
    if (params !== Object(params)) {
      throw new Error("argument must be an object or undefined");
    }
    return stringify(this.ast, params);
  }
}
