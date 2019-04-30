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

export function newEscapedCharParser(options: IOptions): Parser<Ast<any>> {
  return pick(1, string(options.escapeChar), regex(/^./));
}

export function newWildcardParser(options: IOptions): Parser<Ast<any>> {
  return newAst("wildcard", string(options.wildcardChar));
}

/*
 * parses just the segment name in a named segment
 */
export function newSegmentNameParser(options: IOptions): Parser<string> {
  return regex(new RegExp(`^[${ options.segmentNameCharset }]+`));
}

export function newNamedSegmentParser(options: IOptions): Parser<Ast<any>> {
  const parseSegmentName = newSegmentNameParser(options);
  if (options.segmentNameEndChar == null) {
    return newAst("namedSegment", pick(1,
      string(options.segmentNameStartChar),
      parseSegmentName));
  } else {
    return newAst("namedSegment", pick(1,
      string(options.segmentNameStartChar),
      parseSegmentName,
      string(options.segmentNameEndChar)));
  }
}

export function newNamedWildcardParser(options: IOptions): Parser<Ast<any>> {
  if (options.segmentNameEndChar == null) {
    return newAst("namedWildcard", pick(2,
      string(options.wildcardChar),
      string(options.segmentNameStartChar),
      newSegmentNameParser(options),
    ));
  } else {
    return newAst("namedWildcard", pick(2,
      string(options.wildcardChar),
      string(options.segmentNameStartChar),
      newSegmentNameParser(options),
      string(options.segmentNameEndChar),
    ));
  }
}

export function newStaticContentParser(options: IOptions): Parser<Ast<any>> {
  return newAst("staticContent", concatMany1Till(firstChoice(
      newEscapedCharParser(options),
      regex(/^./)),
      // parse any normal or escaped char until the following matches:
      firstChoice(
        string(options.segmentNameStartChar),
        string(options.optionalSegmentStartChar),
        string(options.optionalSegmentEndChar),
        newWildcardParser(options),
        newNamedWildcardParser(options),
      ),
  ));
}

/*
 *
 */
export function newUrlPatternParser(options: IOptions): Parser<Ast<any>> {
  let parsePattern: Parser<any> = (input: string) => {
    throw new Error(`
      this is just a temporary placeholder
      to make a circular dependency work.
      that this got called is a bug
    `);
  };

  const parseOptionalSegment = newAst("optionalSegment", pick(1,
      string(options.optionalSegmentStartChar),
      lazy(() => parsePattern),
      string(options.optionalSegmentEndChar)));

  const parseToken = firstChoice(
    newNamedWildcardParser(options),
    newWildcardParser(options),
    parseOptionalSegment,
    newNamedSegmentParser(options),
    newStaticContentParser(options),
  );

  parsePattern = many1(parseToken);

  return parsePattern;
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
    case "staticContent":
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
    case "staticContent":
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
    case "staticContent":
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
  nextIndexes: { [index: string]: number } = {},
): string {
  if (Array.isArray(astNode)) {
    return stringConcatMap(astNode, (node) => stringify(node, params, nextIndexes));
  }

  switch (astNode.tag) {
    case "wildcard":
      return getParam(params, "_", nextIndexes, true);
    case "namedSegment":
      return getParam(params, astNode.value, nextIndexes, true);
    case "staticContent":
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
