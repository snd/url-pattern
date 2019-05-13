/**
 * escapes a string for insertion into a regular expression
 * source: http://stackoverflow.com/a/3561711
 */
export function escapeStringForRegex(str: string): string {
  return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

/**
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

/**
 * returns the index of the first duplicate element in `elements`
 * or -1 if there are no duplicates.
 */
export function indexOfDuplicateElement<T>(elements: T[]): number {
  const knownElements: Set<T> = new Set();

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    if (knownElements.has(element)) {
      return i;
    }
    knownElements.add(element);
  }

  return -1;
}
