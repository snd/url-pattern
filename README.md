# url-pattern

[![NPM Package](https://img.shields.io/npm/v/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)
[![Build Status](https://travis-ci.org/snd/url-pattern.svg?branch=master)](https://travis-ci.org/snd/url-pattern/branches)
[![Dependencies](https://david-dm.org/snd/url-pattern.svg)](https://david-dm.org/snd/url-pattern)

**url-pattern is simple pattern matching and segment extraction for
urls, domains, filepaths and other strings**

> This is a great little library -- thanks!  
> [michael](https://github.com/snd/url-pattern/pull/7)

```
npm install url-pattern
```

or

```
bower install url-pattern
```

``` javascript
> var UrlPattern = require('url-pattern');
```
``` javascript
> var pattern = new UrlPattern('/api/users/:id');

> pattern.match('/api/users/10');
{id: '10'}

> pattern.match('/api/products/5');
null
```
``` javascript
> var pattern = new UrlPattern('/v:major(.:minor)/*');

> pattern.match('/v1.2/');
{major: '1', minor: '2', _: ''}

> pattern.match('/v2/users');
{major: '2', _: 'users'}

> pattern.match('/v/');
null
```
``` javascript
> var pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(/*)')

> pattern.match('google.de');
{domain: 'google', tld: 'de'}

> pattern.match('https://www.google.com');
{subdomain: 'www', domain: 'google', tld: 'com'}

> pattern.match('http://mail.google.com/mail');
{subdomain: 'mail', domain: 'google', tld: 'com', _: 'mail'}

> pattern.match('google');
null
```

[lib/url-pattern.js](lib/url-pattern.js) supports [AMD](http://requirejs.org/docs/whyamd.html).  
if [AMD](http://requirejs.org/docs/whyamd.html) is not available it sets the global variable `UrlPattern`.

[check out **passage** if you are looking for simple composable routing that builds on top of url-pattern](https://github.com/snd/passage)

### make pattern from string

```javascript
> var pattern = new UrlPattern('/api/users/:id');
```

a `pattern` is immutable after construction
in the sense that it has no method which changes its state.
that makes it easier to reason about.

### match pattern against string

match returns the extracted segments:

```javascript
> pattern.match('/api/users/10');
{id: '10'}
```

or `null` if there was no match:

``` javascript
> pattern.match('/api/products/5');
null
```

pattern strings are compiled into regexes at construction.
this makes `.match()` superfast.

### named segments

`:id` (in the example above) is a named segment:

a named segment starts with `:`.
the `:` is followed by the **name**.
the **name** must be at least one character in the regex character set `a-zA-Z0-9`.

when matching, a named segment consumes all characters in the regex character set
`a-zA-Z0-9-_ %`.
this means a named segment match stops at `/`, `.`, ... but not at `_`, `-` and ` `.

[click here to see how you can change these character sets.](#modifying-the-compiler)

if a named segment name occurs more than once in the pattern string the multiple results
are stored in an array on the returned object:

```javascript
> var pattern = new UrlPattern('/api/users/:ids/posts/:ids');
> pattern.match('/api/users/10/posts/5');
{ids: ['10', '5']}
```

### optional segments, wildcards and escaping

to make part of a pattern optional just wrap it in `(` and `)`:


```javascript
> var pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(/*)');
```

note that `\\` escapes the `:` in `http\\://`.
you can use `\\` to escape any character that has special meaning within
url-pattern: `(`, `)`, `:`, `*`.

```javascript
> pattern.match('google.de');
{domain: 'google', tld: 'de'}
```

optional named segments are stored in the corresponding property, if they exist:

```javascript
> pattern.match('https://www.google.com');
{subdomain: 'www', domain: 'google', tld: 'com'}
```

`*` in patterns are wildcards and match anything.
wildcard matches are collected in the `_` property:

```javascript
> pattern.match('http://mail.google.com/mail');
{subdomain: 'mail', domain: 'google', tld: 'com', _: 'mail'}
```

if there is only one wildcard `_` contains the matching string.
otherwise `_` contains an array of matching strings.

### make pattern from regex

```javascript
> var pattern = new UrlPattern(/\/api\/(.*)/);
```

if the pattern was created from a regex an array of the captured groups is returned on a match:

```javascript
> pattern.match('/api/users');
['users']

> pattern.match('/apiii/test');
null
```

### modifying the compiler

finally we can completely change pattern-parsing and regex-compilation to suit our needs:

let's make a custom compiler:

```javascript
> var compiler = new UrlPattern.Compiler();
```

let's change the char used for escaping (default `\\`):

```javascript
> compiler.escapeChar = '!';
```

let's change the char used to start a named segment (default `:`):

```javascript
> compiler.segmentNameStartChar = '$';
```

let's change the set of chars allowed in named segment names (default `a-zA-Z0-9`)
to also include `_` and `-`:

```javascript
> compiler.segmentNameCharset = 'a-zA-Z0-9_-';
```

let's change the set of chars allowed in named segment values
(default `a-zA-Z0-9_- %`) to not allow non-alphanumeric chars:

```javascript
> compiler.segmentValueCharset = 'a-zA-Z0-9';
```

let's change the chars used to surround an optional segment (default `(` and `)`):

```javascript
> compiler.optionalSegmentStartChar = '[';
> compiler.optionalSegmentEndChar = ']';
```

let's change the char used to denote a wildcard:

```javascript
> compiler.wildcardChar = '?';
```

make url-pattern use our compiler by passing it in as the second argument to the constructor:

```javascript
> var pattern = new UrlPattern(
  '[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]',
  compiler
);
```

### changelog

#### 0.7

instead of

``` javascript
var urlPattern = require('url-pattern');
var pattern = urlPattern.newPattern('/example');
```

now use

``` javascript
var Pattern = require('url-pattern');
var pattern = new Pattern('/example');
```

#### 0.8

single wildcard matches are now saved directly as a
string on the `_` property and not as an array with 1 element:

``` javascript
> var pattern = new Pattern('/api/*');
> pattern.match('/api/users/5')
{_: 'users/5'}
```

if named segments occur more than once the results are collected in an array.

parsing of named segment names (`:foo`) and named segment values now
stops at the next non-alphanumeric character.
it is no longer needed to declare separators other than `/` explicitely.
it was previously necessary to use the second argument to `new UrlPattern` to
override the default separator `/`.
the second argument is now ignored.
mixing of separators is now possible (`/` and `.` in this example):

``` javascript
> var pattern = new UrlPattern('/v:major(.:minor)/*');

> pattern.match('/v1.2/');
{major: '1', minor: '2', _: ''}

> pattern.match('/v2/users');
{major: '2', _: 'users'}

> pattern.match('/v/');
null
```

### 0.9

named segments now also match `-`, `_`, ` ` and `%`.

`\\` can now be used to escape characters.

[made all special chars and charsets used in parsing configurable.](#modifying-the-compiler)

added [bower.json](bower.json) and registered with bower as `url-pattern`.

### contribution

**TLDR: bugfixes, issues and discussion are always welcome.
ask me before implementing new features.**

i will happily merge pull requests that fix bugs with reasonable code.

i will only merge pull requests that modify/add functionality
if the changes align with my goals for this package,
are well written, documented and tested.

**communicate!** write an issue to start a discussion
before writing code that may or may not get merged.

## [license: MIT](LICENSE)
