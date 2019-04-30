/*
 * the url pattern parser
 */

import {
  Ast,
  concatMany1Till,
  firstChoice,
  lazy,
  many1,
  newAst,
  Parser,
  pick,
  regex,
  string,
} from "./parsercombinators";

import {
  concatMap,
  escapeStringForRegex,
  stringConcatMap,
} from "./helpers";

import {
  defaultOptions,
  IOptions,
} from "./options";

/*
 *
 */
export function newUrlPatternParser(options: IOptions): Parser<Ast<any>> {
  const parseEscapedChar = pick(1, string(options.escapeChar), regex(/^./));

  const parseSegmentName = regex(new RegExp(`^[${ options.segmentNameCharset }]+`));

  let parseNamedSegment = newAst("namedSegment", pick(1,
    string(options.segmentNameStartChar),
    parseSegmentName));
  if (options.segmentNameEndChar != null) {
    parseNamedSegment = newAst("namedSegment", pick(1,
      string(options.segmentNameStartChar),
      parseSegmentName,
      string(options.segmentNameEndChar)));
  }

  const parseWildcard = newAst("wildcard", string(options.wildcardChar));

  let pattern: Parser<any> = (input: string) => {
    throw new Error(`
      this is just a temporary placeholder
      to make a circular dependency work.
      that this got called is a bug
    `);
  };

  const parseOptionalSegment = newAst("optionalSegment", pick(1,
      string(options.optionalSegmentStartChar),
      lazy(() => pattern),
      string(options.optionalSegmentEndChar)));

  const parseStatic = newAst("static", concatMany1Till(firstChoice(
      parseEscapedChar,
      regex(/^./)),
      firstChoice(
        string(options.segmentNameStartChar),
        string(options.optionalSegmentStartChar),
        string(options.optionalSegmentEndChar),
        lazy(() => parseWildcard))));

  const token = firstChoice(
    parseWildcard,
    parseOptionalSegment,
    parseNamedSegment,
    parseStatic);

  pattern = many1(token);

  return pattern;
}

// functions that further process ASTs returned as `.value` in parser results

function baseAstNodeToRegexString(astNode: Ast<any>, segmentValueCharset: string): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => baseAstNodeToRegexString(node, segmentValueCharset));
  }

  switch (astNode.tag) {
    case "wildcard":
      return "(.*?)";
    case "namedSegment":
      return `([${ segmentValueCharset }]+)`;
    case "static":
      return escapeStringForRegex(astNode.value);
    case "optionalSegment":
      return `(?:${ baseAstNodeToRegexString(astNode.value, segmentValueCharset) })?`;
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

export function astNodeToRegexString(astNode: Ast<any>, segmentValueCharset?: string) {
  if (segmentValueCharset == null) {
    ({ segmentValueCharset } = defaultOptions);
  }
  return `^${ baseAstNodeToRegexString(astNode, segmentValueCharset) }$`;
}

export function astNodeToNames(astNode: Ast<any> | Array<Ast<any>>): string[] {
  if (Array.isArray(astNode)) {
    return concatMap(astNode, astNodeToNames);
  }

  switch (astNode.tag) {
    case "wildcard":
      return ["_"];
    case "namedSegment":
      return [astNode.value];
    case "static":
      return [];
    case "optionalSegment":
      return astNodeToNames(astNode.value);
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

// TODO better name
export function getParam(
  params: { [index: string]: any },
  key: string,
  nextIndexes: { [index: string]: number },
  hasSideEffects: boolean,
) {
  if (hasSideEffects == null) {
    hasSideEffects = false;
  }
  const value = params[key];
  if (value == null) {
    if (hasSideEffects) {
      throw new Error(`no values provided for key \`${ key }\``);
    } else {
      return;
    }
  }
  const index = nextIndexes[key] || 0;
  const maxIndex = Array.isArray(value) ? value.length - 1 : 0;
  if (index > maxIndex) {
    if (hasSideEffects) {
      throw new Error(`too few values provided for key \`${ key }\``);
    } else {
      return;
    }
  }

  const result = Array.isArray(value) ? value[index] : value;

  if (hasSideEffects) {
    nextIndexes[key] = index + 1;
  }

  return result;
}

function astNodeContainsSegmentsForProvidedParams(
  astNode: Ast<any>,
  params: { [index: string]: any },
  nextIndexes: { [index: string]: number },
): boolean {
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
    case "namedSegment":
      return getParam(params, astNode.value, nextIndexes, false) != null;
    case "static":
      return false;
    case "optionalSegment":
      return astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes);
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

/*
 * stringify a url pattern AST
 */
export function stringify(
  astNode: Ast<any> | Array<Ast<any>>,
  params: { [index: string]: any },
  nextIndexes: { [index: string]: number },
): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => stringify(node, params, nextIndexes));
  }

  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, true);
    case "namedSegment":
      return getParam(params, astNode.value, nextIndexes, true);
    case "static":
      return astNode.value;
    case "optionalSegment":
      if (astNodeContainsSegmentsForProvidedParams(astNode.value, params, nextIndexes)) {
        return stringify(astNode.value, params, nextIndexes);
      } else {
        return "";
      }
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}
