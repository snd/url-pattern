/*
 * generic parser combinators used to build the url pattern parser (module `parser`)
 */

/*
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

/*
 * a parser is a function that takes a string and returns a `Result`
 * containing a parsed `Result.value` and the rest of the string `Result.rest`
 */
export type Parser<T> = (str: string) => Result<T> | undefined;

/*
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
 * parser that consumes everything matched by `regex`
 */
export function regex(regexp: RegExp): Parser<string> {
  return (input: string) => {
    const matches = regexp.exec(input);
    if (matches == null) {
      return;
    }
    const result = matches[0];
    return new Result(result, input.slice(result.length));
  };
}

/*
 * takes a sequence of parsers and returns a parser that runs
 * them in sequence and produces an array of their results
 */
export function sequence(...parsers: Array<Parser<any>>): Parser<any[]> {
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
 * returns a parser that consumes `str` exactly
 */
export function string(str: string): Parser<string> {
  const { length } = str;
  return (input: string) => {
    if (input.slice(0, length) === str) {
      return new Result(str, input.slice(length));
    }
  };
}

/*
 * takes a sequence of parser and only returns the result
 * returned by the `index`th parser
 */
export function pick(index: number, ...parsers: Array<Parser<any>>): Parser<any> {
  const parser = sequence(...parsers);
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
export function lazy<T>(getParser: () => Parser<T>): Parser<T> {
  let cachedParser: Parser<T> | null = null;
  return (input: string) => {
    if (cachedParser == null) {
      cachedParser = getParser();
    }
    return cachedParser(input);
  };
}

/*
 * base function for parsers that parse multiples.
 *
 * @param endParser  once the `endParser` (if not null) consumes
 * the `baseMany` parser returns. the result of the `endParser` is ignored.
 */
export function baseMany<T>(
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
}

export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return (input: string) => {
    const endParser: null = null;
    const isAtLeastOneResultRequired = true;
    return baseMany(parser, endParser, isAtLeastOneResultRequired, input);
  };
}

export function concatMany1Till(parser: Parser<string>, endParser: Parser<any>): Parser<string> {
  return (input: string) => {
    const isAtLeastOneResultRequired = true;
    const result = baseMany(parser, endParser, isAtLeastOneResultRequired, input);
    if (result == null) {
      return;
    }
    return new Result(result.value.join(""), result.rest);
  };
}

/*
 * takes a sequence of parsers. returns the result from the first
 * parser that consumes the input.
 */
export function firstChoice(...parsers: Array<Parser<any>>): Parser<any> {
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
