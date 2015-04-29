# url-pattern

[![NPM Package](https://img.shields.io/npm/v/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)
[![Build Status](https://travis-ci.org/snd/url-pattern.svg?branch=master)](https://travis-ci.org/snd/url-pattern/branches)
[![Dependencies](https://david-dm.org/snd/url-pattern.svg)](https://david-dm.org/snd/url-pattern)

**url-pattern is simple pattern matching and segment extraction for
urls, domains, filepaths and other strings**

> This is a great little library -- thanks!  
> [@michael](https://github.com/snd/url-pattern/pull/7)

```
npm install url-pattern
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

[lib/url-pattern.js](lib/url-pattern.js) supports [AMD](http://requirejs.org/docs/whyamd.html).  
if [AMD](http://requirejs.org/docs/whyamd.html) is not available it sets the global variable `UrlPattern`.

[check out **passage** if you are looking for simple composable routing that builds on top of url-pattern](https://github.com/snd/passage)

### make pattern from string

```javascript
> var pattern = new UrlPattern('/users/:id');
```

### match pattern against string

match returns the extracted segments:

```javascript
> pattern.match('/users/5');
{id: '5'}
```

or `null` if there was no match:

``` javascript
> pattern.match('/projects/5');
null
```

named segment names (starting with `:`) and named segment values
stop at the next non-alphanumeric character.

### make pattern from regex

```javascript
> var pattern = new UrlPattern(/\/test\/(.*)/);
```

### match regex pattern against string

if the pattern was created from a regex an array of the captured groups is returned on a match:

```javascript
> pattern.match('/test/users');
['users']

> pattern.match('/users/test');
null
```

### wildcards

```javascript
var pattern = new Pattern('*/users/:id/*');
```

wildcard matches are collected in the `_` property:

```javascript
> pattern.match('/api/v1/users/10/followers/20');
{id: '10', _: ['/api/v1', 'followers/20']}
```

if there is only one wildcard `_` contains the matching string.
otherwise `_` contains an array of matching strings.

### optional segments

```javascript
var pattern = new Pattern('(/)users(/:foo)/bar(/*)');
```

optional matches are stored in the corresponding property, if they exist:

```javascript
> pattern.match('users/bar');
{}

> pattern.match('/users/bar');
{}

> pattern.match('/users/biff/bar');
{foo: 'biff'}

> pattern.match('/users/biff/bar/beep/boop');
{foo: 'biff', _: 'beep/boop'}
```

### matching domains

``` javascript
> var pattern = new Pattern(':sub.google.com');

> pattern.match('www.google.com');
{sub: 'www'}

> pattern.match('www.google.io');
null
```

``` javascript
> var pattern = new Pattern('*.:sub.google.*');

> pattern.match('subsub.www.google.com');;
{sub: 'www', _: ['subsub', 'com']}
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
