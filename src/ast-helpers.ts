/**
 * functions that work on ASTs returned from the url-pattern parser
 * within the `parser` module.
 */

import {
  Ast,
} from "./parser-combinators";

import {
  escapeStringForRegex,
} from "./helpers";

/**
 * converts an array of AST nodes `nodes` representing a parsed url-pattern into
 * a string representing the regex which matches that url-pattern.
 */
function astToRegexString(nodes: Array<Ast<any>>, segmentValueCharset: string): string {
  let result = "";

  for (const node of nodes) {
    switch (node.tag) {
      case "wildcard":
        // ? = lazy
        result += ".*?";
        continue;
      case "namedWildcard":
        // ? = lazy
        result += "(.*?)";
        continue;
      case "namedSegment":
        result += `([${ segmentValueCharset }]+)`;
        continue;
      case "staticContent":
        result += escapeStringForRegex(node.value);
        continue;
      case "optionalSegment":
        result += `(?:${ astToRegexString(node.value, segmentValueCharset) })?`;
        continue;
      default:
        throw new Error(`unknown tag \`${ node.tag }\``);
    }
  }

  return result;
}

/**
 * converts the root `astNode` of a parsed url-pattern into
 * a string representing the regex that matches the url-pattern.
 */
export function astRootToRegexString(nodes: Array<Ast<any>>, segmentValueCharset: string) {
  return `^${ astToRegexString(nodes, segmentValueCharset) }$`;
}

/**
 * returns the names of any named segments and named wildcards contained
 * in the url-pattern represented by the given AST `nodes` in order.
 */
export function astToNames(nodes: Array<Ast<any>>): string[] {
  const result: string[] = [];

  for (const node of nodes) {
    switch (node.tag) {
      case "wildcard":
      case "staticContent":
        continue;
      case "namedWildcard":
      case "namedSegment":
        result.push(node.value);
        continue;
      case "optionalSegment":
        // recurse into the optional segment
        // optional segments values are always arrays
        result.push(...astToNames(node.value));
        continue;
      default:
        throw new Error(`unknown tag \`${ node.tag }\``);
    }
  }

  return result;
}

/**
 * returns whether the given `astNode` contains
 * any segments that
 * based on this information optional segments are included or not.
 */
function astContainsAnySegmentsForParams(
  nodes: Array<Ast<any>>,
  params: { [index: string]: any },
): boolean {
  for (const node of nodes) {
    switch (node.tag) {
      case "staticContent":
      case "wildcard":
        continue;
      case "namedWildcard":
      case "namedSegment":
        if (params[node.value] != null) {
          return true;
        }
        continue;
      case "optionalSegment":
        if (astContainsAnySegmentsForParams(node.value, params)) {
          return false;
        }
        continue;
      default:
        throw new Error(`unknown tag \`${ node.tag }\``);
    }
  }
  return false;
}

/**
 * turn an url-pattern AST and a mapping of `namesToValues` into a string
 */
export function stringify(
  nodes: Array<Ast<any>>,
  namesToValues: { [index: string]: any },
): string {
  let result = "";

  for (const node of nodes) {
    switch (node.tag) {
      case "wildcard":
        continue;
      case "namedWildcard":
      case "namedSegment":
        const value = namesToValues[node.value];
        if (value == null) {
          throw new Error(`no value provided for name \`${ node.value }\``);
        }
        result += value;
        continue;
      case "staticContent":
        result += node.value;
        continue;
      case "optionalSegment":
        // only add optional segments if values are present.
        // optional segments are only included if values are provided
        // for all names (of named segments) within the optional segment
        if (astContainsAnySegmentsForParams(node.value, namesToValues)) {
          // recurse into the optional segment
          // optional segments values are always arrays
          result += stringify(node.value, namesToValues);
        }
        continue;
      default:
        throw new Error(`unknown tag \`${ node.tag }\``);
    }
  }

  return result;
}
