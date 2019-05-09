/**
 * generic parser combinators used to build the url pattern parser (module `parser`)
 */

/**
 * parse result
 */
export class Result<Value> {
  /* parsed value */
  public readonly value: Value;
  /* unparsed rest */
  public readonly rest: string;
  constructor(value: Value, rest: string) {
    this.value = value;
    this.rest = rest;
  }
}

/**
 * a parser is a function that takes a string and returns a `Result`
 * containing a parsed `Result.value` and the rest of the string `Result.rest`
 */
export type Parser<T> = (str: string) => Result<T> | undefined;

/*
 * returns a parser that consumes `str` exactly
 */
export function newStringParser(str: string): Parser<string> {
  const { length } = str;
  return (input: string) => {
    if (input.slice(0, length) === str) {
      return new Result(str, input.slice(length));
    }
  };
}

/**
 * returns a parser that consumes everything matched by `regexp`
 */
export function newRegexParser(regexp: RegExp): Parser<string> {
  return (input: string) => {
    const matches = regexp.exec(input);
    if (matches == null) {
      return;
    }
    const result = matches[0];
    return new Result(result, input.slice(result.length));
  };
}

/**
 * node in the AST (abstract syntax tree)
 */
export class Ast<Value> {
  public readonly tag: string;
  public readonly value: Value;
  constructor(tag: string, value: Value) {
    this.tag = tag;
    this.value = value;
  }
}

/**
 * transforms a `parser` into a parser that returns an Ast node
 */
export function newAst<T>(tag: string, parser: Parser<T>): Parser<Ast<T>> {
  return (input: string) => {
    const result = parser(input);
    if (result == null) {
      return;
    }
    const ast = new Ast(tag, result.value);
    return new Result(ast, result.rest);
  };
}

/*
 * takes many `parsers`.
 * returns a new parser that runs
 * all `parsers` in sequence and returns an array of their results
 */
export function newSequenceParser(...parsers: Array<Parser<any>>): Parser<any[]> {
  return (input: string) => {
    let rest = input;
    const values: any[] = [];
    for (const parser of parsers) {
      const result = parser(rest);
      if (result == null) {
        return;
      }
      values.push(result.value);
      rest = result.rest;
    }
    return new Result(values, rest);
  };
}

/*
 * takes an `index` and many `parsers`
 *
 * takes a sequence of parser and only returns the result
 * returned by the `index`th parser
 */
export function newPickNthParser(index: number, ...parsers: Array<Parser<any>>): Parser<any> {
  const parser = newSequenceParser(...parsers);
  return (input: string) => {
    const result = parser(input);
    if (result == null) {
      return;
    }
    return new Result(result.value[index], result.rest);
  };
}

/*
 * for parsers that each depend on one another (cyclic dependencies)
 * postpone lookup to when they both exist.
 */
export function newLazyParser<T>(getParser: () => Parser<T>): Parser<T> {
  let cachedParser: Parser<T> | null = null;
  return (input: string) => {
    if (cachedParser == null) {
      cachedParser = getParser();
    }
    return cachedParser(input);
  };
}

/**
 * takes a `parser` and returns a parser that parses
 * many occurences of the parser
 * returns the results collected in an array.
 */
export function newAtLeastOneParser<T>(parser: Parser<T>): Parser<T[]> {
  return (input: string) => {
    let rest = input;
    const results: T[] = [];
    while (true) {
      const parserResult = parser(rest);
      if (parserResult == null) {
        break;
      }
      results.push(parserResult.value);
      rest = parserResult.rest;
    }

    if (results.length === 0) {
      return;
    }

    return new Result(results, rest);
  };
}

/**
 * takes a `parser` returning strings.
 * returns a parser that parses
 * at least one occurence of `parser` and concatenates the results.
 * stops parsing whenever `endParser` matches and ignores the `endParser` result.
 */
export function newConcatAtLeastOneUntilParser(parser: Parser<string>, endParser: Parser<any>): Parser<string> {
  return (input: string) => {
    let hasAtLeastOneMatch = false;
    let rest = input;
    let result = "";

    while (true) {
      if (endParser != null) {
        if (endParser(rest) != null) {
          break;
        }
      }

      const parserResult = parser(rest);
      if (parserResult == null) {
        break;
      }

      hasAtLeastOneMatch = true;
      result += parserResult.value;
      rest = parserResult.rest;
    }

    if (!hasAtLeastOneMatch) {
      return;
    }

    return new Result(result, rest);
  };
}

/**
 * takes many `parsers`.
 * returns a new parser that tries all `parsers` in order
 * and stops and returns as soon as a parser returns a non-null result.
 */
// TODO any
export function newEitherParser(...parsers: Array<Parser<any>>): Parser<any> {
  return (input: string) => {
    for (const parser of parsers) {
      const result = parser(input);
      if (result != null) {
        return result;
      }
    }
    return;
  };
}
