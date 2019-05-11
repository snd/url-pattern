/**
 * functions that work on ASTs returned from the url-pattern parser
 * within the `parser` module.
 */

import {
  Ast,
} from "./parser-combinators";

import {
  concatMap,
  escapeStringForRegex,
  stringConcatMap,
} from "./helpers";

import {
  defaultOptions,
} from "./options";

/**
 * converts an `astNode` within the AST of a parsed url-pattern into
 * a string representing the regex that matches the url-pattern.
 */
function astToRegexString(astNode: Ast<any>, segmentValueCharset: string): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => astToRegexString(node, segmentValueCharset));
  }

  switch (astNode.tag) {
    case "wildcard":
      return "(.*?)";
    case "namedWildcard":
      return "(.*?)";
    case "namedSegment":
      return `([${ segmentValueCharset }]+)`;
    case "staticContent":
      return escapeStringForRegex(astNode.value);
    case "optionalSegment":
      return `(?:${ astToRegexString(astNode.value, segmentValueCharset) })?`;
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

/**
 * converts the root `astNode` of a parsed url-pattern into
 * a string representing the regex that matches the url-pattern.
 */
export function astRootToRegexString(astNode: Ast<any>, segmentValueCharset?: string) {
  if (segmentValueCharset == null) {
    ({ segmentValueCharset } = defaultOptions);
  }
  return `^${ astToRegexString(astNode, segmentValueCharset) }$`;
}

/**
 * returns the names of any named segments and wildcards contained
 * in the url-pattern represented by the given `astNode` in order.
 */
export function astToNames(astNode: Ast<any> | Array<Ast<any>>): string[] {
  if (Array.isArray(astNode)) {
    return concatMap(astNode, astToNames);
  }

  switch (astNode.tag) {
    case "wildcard":
      return ["_"];
    case "namedWildcard":
      return [astNode.value];
    case "namedSegment":
      return [astNode.value];
    case "staticContent":
      return [];
    case "optionalSegment":
      return astToNames(astNode.value);
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

/**
 * since a param
 * nextIndexes contains a mapping from param key to the
 * next index
 * `hasSideEffects` is a boolean that controls whether
 */
export function getParam(
  params: { [index: string]: any },
  key: string,
  nextIndexes: { [index: string]: number },
  hasSideEffects: boolean = false,
) {
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

/**
 * returns whether the given `astNode` contains
 */
function astNodeContainsAnySegmentsForParams(
  astNode: Ast<any>,
  params: { [index: string]: any },
  nextIndexes: { [index: string]: number },
): boolean {
  if (Array.isArray(astNode)) {
    let i = -1;
    const { length } = astNode;
    while (++i < length) {
      if (astNodeContainsAnySegmentsForParams(astNode[i], params, nextIndexes)) {
        return true;
      }
    }
    return false;
  }

  // TODO namedWildcard
  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, false) != null;
    case "namedSegment":
      return getParam(params, astNode.value, nextIndexes, false) != null;
    case "staticContent":
      return false;
    case "optionalSegment":
      return astNodeContainsAnySegmentsForParams(astNode.value, params, nextIndexes);
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}

/**
 * stringify an url-pattern AST
 */
export function stringify(
  astNode: Ast<any> | Array<Ast<any>>,
  params: { [index: string]: any },
  nextIndexes: { [index: string]: number } = {},
): string {
  // stringify an array by concatenating the result of stringifying its elements
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => stringify(node, params, nextIndexes));
  }

  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, true);
    case "namedWildcard":
      return getParam(params, astNode.value, nextIndexes, true);
    case "namedSegment":
      return getParam(params, astNode.value, nextIndexes, true);
    case "staticContent":
      return astNode.value;
    case "optionalSegment":
      if (astNodeContainsAnySegmentsForParams(astNode.value, params, nextIndexes)) {
        return stringify(astNode.value, params, nextIndexes);
      } else {
        return "";
      }
    default:
      throw new Error(`unknown tag \`${ astNode.tag }\``);
  }
}
