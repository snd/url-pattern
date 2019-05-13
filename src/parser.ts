/*
 * the url pattern parser
 */

import {
  Ast,
  newAst,
  newAtLeastOneParser,
  newConcatAtLeastOneUntilParser,
  newEitherParser,
  newLazyParser,
  newPickNthParser,
  newRegexParser,
  newStringParser,
  Parser,
// @ts-ignore
} from "./parser-combinators.ts";

import {
  IOptions,
// @ts-ignore
} from "./options.ts";

export function newEscapedCharParser(options: IOptions): Parser<Ast<any>> {
  return newPickNthParser(1, newStringParser(options.escapeChar), newRegexParser(/^./));
}

export function newWildcardParser(options: IOptions): Parser<Ast<any>> {
  return newAst("wildcard", newStringParser(options.wildcardChar));
}

/*
 * parses just the segment name in a named segment
 */
export function newSegmentNameParser(options: IOptions): Parser<string> {
  return newRegexParser(new RegExp(`^[${ options.segmentNameCharset }]+`));
}

export function newNamedSegmentParser(options: IOptions): Parser<Ast<any>> {
  const parseSegmentName = newSegmentNameParser(options);
  if (options.segmentNameEndChar == null) {
    return newAst("namedSegment", newPickNthParser(1,
      newStringParser(options.segmentNameStartChar),
      parseSegmentName));
  } else {
    return newAst("namedSegment", newPickNthParser(1,
      newStringParser(options.segmentNameStartChar),
      parseSegmentName,
      newStringParser(options.segmentNameEndChar)));
  }
}

export function newNamedWildcardParser(options: IOptions): Parser<Ast<any>> {
  if (options.segmentNameEndChar == null) {
    return newAst("namedWildcard", newPickNthParser(2,
      newStringParser(options.wildcardChar),
      newStringParser(options.segmentNameStartChar),
      newSegmentNameParser(options),
    ));
  } else {
    return newAst("namedWildcard", newPickNthParser(2,
      newStringParser(options.wildcardChar),
      newStringParser(options.segmentNameStartChar),
      newSegmentNameParser(options),
      newStringParser(options.segmentNameEndChar),
    ));
  }
}

export function newStaticContentParser(options: IOptions): Parser<Ast<any>> {
  const parseUntil = newEitherParser(
      newStringParser(options.segmentNameStartChar),
      newStringParser(options.optionalSegmentStartChar),
      newStringParser(options.optionalSegmentEndChar),
      newWildcardParser(options),
      newNamedWildcardParser(options),
    );
  return newAst("staticContent", newConcatAtLeastOneUntilParser(newEitherParser(
      newEscapedCharParser(options),
      newRegexParser(/^./)),
      // parse any normal or escaped char until the following matches:
      parseUntil,
  ));
}

/*
 *
 */
export function newUrlPatternParser(options: IOptions): Parser<Array<Ast<any>>> {
  let parsePattern: Parser<any> = (input: string) => {
    throw new Error(`
      this is just a temporary placeholder
      to make a circular dependency work.
      if you see this error it's a bug.
    `);
  };

  const parseOptionalSegment = newAst("optionalSegment", newPickNthParser(1,
      newStringParser(options.optionalSegmentStartChar),
      newLazyParser(() => parsePattern),
      newStringParser(options.optionalSegmentEndChar)));

  const parseToken = newEitherParser(
    newNamedWildcardParser(options),
    newWildcardParser(options),
    parseOptionalSegment,
    newNamedSegmentParser(options),
    newStaticContentParser(options),
  );

  parsePattern = newAtLeastOneParser(parseToken);

  return parsePattern;
}
