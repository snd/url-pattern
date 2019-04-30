/*
 * escapes a string for insertion into a regular expression
 * source: http://stackoverflow.com/a/3561711
 */
export function escapeStringForRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/*
 * like `Array.prototype.map` except that the function `f`
 * returns an array and `concatMap` returns the concatenation
 * of all arrays returned by `f`
 */
export function concatMap<T>(array: T[], f: (x: T) => T[]): T[] {
  let results: T[] = [];
  for (const value of array) {
    results = results.concat(f(value));
  }
  return results;
}

/*
 * like `Array.prototype.map` except that the function `f`
 * returns a string and `stringConcatMap` returns the concatenation
 * of all strings returned by `f`
 */
export function stringConcatMap<T>(array: T[], f: (x: T) => string): string {
  let result = "";
  for (const value of array) {
    result += f(value);
  }
  return result;
}

/*
 * returns the number of groups in the `regex`.
 * source: http://stackoverflow.com/a/16047223
 */
export function regexGroupCount(regex: RegExp): number {
  const testingRegex = new RegExp(regex.toString() + "|");
  const matches = testingRegex.exec("");
  if (matches == null) {
    throw new Error("no matches");
  }
  return matches.length - 1;
}

/*
 * zips an array of `keys` and an array of `values` into an object
 * so `keys[i]` is associated with `values[i]` for every i.
 * `keys` and `values` must have the same length.
 * if the same key appears multiple times the associated values are collected in an array.
 */
export function keysAndValuesToObject(keys: string[], values: any[]): object {
  const result: { [index: string]: any } = {};

  if (keys.length !== values.length) {
    throw Error("keys.length must equal values.length");
  }

  let i = -1;
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
