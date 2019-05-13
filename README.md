# url-pattern

[![NPM Package](https://img.shields.io/npm/v/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)
[![Build Status](https://travis-ci.org/snd/url-pattern.svg?branch=master)](https://travis-ci.org/snd/url-pattern/branches)
[![Sauce Test Status](https://saucelabs.com/buildstatus/urlpattern)](https://saucelabs.com/u/urlpattern)
[![codecov.io](http://codecov.io/github/snd/url-pattern/coverage.svg?branch=master)](http://codecov.io/github/snd/url-pattern?branch=master)
[![Downloads per Month](https://img.shields.io/npm/dm/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)

**easier than regex string matching patterns for urls and other strings.  
turn strings into data or data into strings.**

> This is a great little library -- thanks!  
> [michael](https://github.com/snd/url-pattern/pull/7)

[make a pattern:](#make-pattern-from-string)
```typescript
> const pattern = new UrlPattern("/api/users(/:id)");
```

[match a pattern against a string and extract values:](#match-pattern-against-string)
```typescript
> pattern.match("/api/users/10");
{id: "10"}

> pattern.match("/api/users");
{}

> pattern.match("/api/products/5");
undefined
```

[generate a string from a pattern and values:](#stringify-patterns)
```typescript
> pattern.stringify()
"/api/users"

> pattern.stringify({id: 20})
"/api/users/20"
```

prefer a different syntax? [customize it:](#customize-the-pattern-syntax)
```typescript
> const pattern = new UrlPattern("/api/users/{id}", {
  segmentNameEndChar: "}",
  segmentNameStartChar: "{",
}

> pattern.match("/api/users/5")
{id: "5"}
```

- continuously tested in Node.js (10.15 (LTS), 12) and all relevant browsers:
- [tiny source of around 500 lines of simple, readable, maintainable typescript](src/)
- [huge test suite](test)
  passing [![Build Status](https://travis-ci.org/snd/url-pattern.svg?branch=master)](https://travis-ci.org/snd/url-pattern/branches)
  with [![codecov.io](http://codecov.io/github/snd/url-pattern/coverage.svg?branch=master)](http://codecov.io/github/snd/url-pattern?branch=master)
  code coverage
- widely used [![Downloads per Month](https://img.shields.io/npm/dm/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)
- very fast matching as each pattern is compiled into a regex
- zero dependencies
- [customizable](#customize-the-pattern-syntax)
- [frequently asked questions](#frequently-asked-questions)
- pattern parser implemented using simple, composable, testable [parser combinators](https://en.wikipedia.org/wiki/Parser_combinator)

## a more complex example showing the power of url-pattern

``` typescript
> const pattern = new UrlPattern("(http(s)\\://)(:subdomain.):domain.:tld(\\::port)(/*:path)")

> pattern.match("google.de");
{domain: "google", tld: "de"}

> pattern.match("https://www.google.com");
{subdomain: "www", domain: "google", tld: "com"}

> pattern.match("http://mail.google.com/mail");
{subdomain: "mail", domain: "google", tld: "com", path: "mail"}

> pattern.match("http://mail.google.com:80/mail/inbox");
{subdomain: "mail", domain: "google", tld: "com", port: "80", path: "mail/inbox"}

> pattern.match("google");
undefined
```

## install

```
npm install url-pattern
```
and
```typescript
> import UrlPattern from "url-pattern";
```
or
```typescript
> const UrlPattern = require("url-pattern");
```

## url-pattern works with [deno](https://deno.land/):

**bleeding edge** master:
```typescript
import UrlPattern from "https://raw.githubusercontent.com/snd/url-pattern/2.0.0/src/url-pattern.ts";
```

**stable** latest release:
```typescript
import UrlPattern from "https://raw.githubusercontent.com/snd/url-pattern/master/src/url-pattern.ts";
```

you can also use the parser combinators url-pattern is build on:
```typescript
import UrlPattern from "https://raw.githubusercontent.com/snd/url-pattern/master/src/parser-combinators.ts";
```

TODO see the documentation here

## reference

### make pattern from string

```typescript
> const pattern = new UrlPattern("/api/users/:id");
```

a `pattern` is immutable after construction.  
none of its methods changes its state.  
that makes it easier to reason about.

### match pattern against string

match returns the extracted segments:

```typescript
> pattern.match("/api/users/10");
{id: "10"}
```

or `undefined` if there was no match:

```typescript
> pattern.match("/api/products/5");
undefined
```

patterns are compiled into regexes which makes `.match()` superfast.

### named segments

`:id` (in the example above) is a named segment:

a named segment starts with `:` followed by the **name**.  
the **name** must be at least one character in the regex character set `a-zA-Z0-9`.

when matching, a named segment consumes all characters in the regex character set
`a-zA-Z0-9-_~ %`.
a named segment match stops at `/`, `.`, ... but not at `_`, `-`, ` `, `%`...

[you can change these character sets. click here to see how.](#customize-the-pattern-syntax)

a named segment name can only occur once in the pattern string.

### optional segments, wildcards and escaping

to make part of a pattern optional just wrap it in `(` and `)`:

```typescript
> const pattern = new UrlPattern(
  "(http(s)\\://)(:subdomain.):domain.:tld(/*:path)"
);
```

note that `\\` escapes the `:` in `http(s)\\://`.
you can use `\\` to escape `(`, `)`, `:` and `*` which have special meaning within
url-pattern.

optional named segments are stored in the corresponding property only if they are present in the source string:

```typescript
> pattern.match("google.de");
{domain: "google", tld: "de"}
```

```typescript
> pattern.match("https://www.google.com");
{subdomain: "www", domain: "google", tld: "com"}
```

`:*{name}` in patterns are named wildcards and match anything.

```typescript
> pattern.match("http://mail.google.com/mail");
{subdomain: "mail", domain: "google", tld: "com", path: "mail"}
```

wildcards can be named like this:
unnamed wildcards are not collected.

```typescript
> const pattern = new UrlPattern('/search/*:term');
> pattern.match('/search/fruit');
{term: 'fruit'}
```

[look at the tests for additional examples of `.match`](test/match-fixtures.ts)

### make pattern from regex

```typescript
> const pattern = new UrlPattern(/^\/api\/(.*)$/, ["path"]);

> pattern.match("/api/users");
{path: "users"}

> pattern.match("/apiii/test");
undefined
```

when making a pattern from a regex
you have to pass an array of keys as the second argument.
returns objects on match with each key mapped to a captured value:

```typescript
> const pattern = new UrlPattern(
  /^\/api\/([^\/]+)(?:\/(\d+))?$/,
  ["resource", "id"]
);

> pattern.match("/api/users");
{resource: "users"}

> pattern.match("/api/users/5");
{resource: "users", id: "5"}

> pattern.match("/api/users/foo");
undefined
```

### stringify patterns

```typescript
> const pattern = new UrlPattern("/api/users/:id");

> pattern.stringify({id: 10})
"/api/users/10"
```

optional segments are only included in the output if they contain named segments
and/or wildcards and values for those are provided:

```typescript
> const pattern = new UrlPattern("/api/users(/:id)");

> pattern.stringify()
"/api/users"

> pattern.stringify({id: 10})
"/api/users/10"
```

named wildcards and deeply nested optional groups should stringify as expected.

TODO
an error is thrown if a value that is not in an optional group is not provided.

an error is thrown if an optional segment contains multiple
params and not all of them are provided.
*one provided value for an optional segment
makes all values in that optional segment required.*

TODO
anonymous wildcards are ignored.

[look at the tests for additional examples of `.stringify`](test/stringify-fixtures.ts)

### customize the pattern syntax

finally we can completely change pattern-parsing and regex-compilation to suit our needs:

```typescript
> let options = {};
```

let's change the char used for escaping (default `\\`):

```typescript
> options.escapeChar = "!";
```

let's change the char used to start a named segment (default `:`):

```typescript
> options.segmentNameStartChar = "{";
```

let's add a char required at the end of a named segment (default nothing):

```typescript
> options.segmentNameEndChar = "}";
```

let's change the set of chars allowed in named segment names (default `a-zA-Z0-9_`)
to also include `-`:

```typescript
> options.segmentNameCharset = "a-zA-Z0-9_-";
```

let's change the set of chars allowed in named segment values
(default `a-zA-Z0-9-_~ %`) to not allow non-alphanumeric chars:

```typescript
> options.segmentValueCharset = "a-zA-Z0-9";
```

let's change the chars used to surround an optional segment (default `(` and `)`):

```typescript
> options.optionalSegmentStartChar = "<";
> options.optionalSegmentEndChar = ">";
```

let's change the char used to denote a wildcard (default `*`):

```typescript
> options.wildcardChar = "#";
```

pass options as the second argument to the constructor:

```typescript
> const pattern = new UrlPattern(
  "<http<s>!://><{sub_domain}.>{domain}.{toplevel-domain}</#{path}>",
  options
);
```

then match:

```typescript
> pattern.match("http://mail.google.com/mail");
{
  sub_domain: "mail",
  domain: "google",
  "toplevel-domain": "com",
  path: "mail"
}
```

## frequently asked questions

### how do i match the query part of an URL ?

the query part of an URL has very different semantics than the rest.
url-pattern is not well suited for parsing the query part.

there are good existing libraries for parsing the query part of an URL.
https://github.com/hapijs/qs is an example.
in the interest of keeping things simple and focused
i see no reason to add special support
for parsing the query part to url-pattern.

i recommend splitting the URL at `?`, using url-pattern
to parse the first part (scheme, host, port, path)
and using https://github.com/hapijs/qs to parse the last part (query).

### how do i match an IP ?

you can't exactly match IPs with url-pattern so you have to
fall back to regexes and pass in a regex object.

[here's how you do it](https://github.com/snd/url-pattern/blob/c8e0a943bb62e6feeca2d2595da4e22782e617ed/test/match-fixtures.coffee#L237)

## [contributing](contributing.md)

## [license: MIT](LICENSE)
