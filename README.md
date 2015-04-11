# url-pattern

[![NPM Package](https://img.shields.io/npm/v/url-pattern.svg?style=flat)](https://www.npmjs.org/package/url-pattern)
[![Build Status](https://travis-ci.org/snd/url-pattern.svg?branch=master)](https://travis-ci.org/snd/url-pattern/branches)
[![Dependencies](https://david-dm.org/snd/url-pattern.svg)](https://david-dm.org/snd/url-pattern)

> url-pattern is easy pattern matching and segment extraction for
> urls, domains, filepaths and any string composed of segments joined
> by a separator character

[check out **passage** if you are looking for simple composable routing that builds on top of url-pattern](https://github.com/snd/passage)

```
npm install url-pattern
```

require with commonjs:

```javascript
var Pattern = require('url-pattern');
```

[lib/url-pattern.js](lib/url-pattern.js) can be used in the browser.
it supports AMD as well.

### match urls or filepaths

##### make pattern from string

```javascript
var pattern = new Pattern('/users/:id');
```

the default separator is `/`. you can pass a custom separator
as the second argument.

##### match pattern against url

match returns the extracted parameters or `null` if there was no match:

```javascript
pattern.match('/users/5'); // => {id: '5'}
pattern.match('/projects/5'); // => null
```

##### make pattern from regex

```javascript
var regexPattern = new Pattern(/\/test\/(.*)/);
```

##### match regex pattern against url

if the pattern was created from a regex an array of the captured groups is returned on match:

```javascript
regexPattern.match('/test/users'); // => ['users']
regexPattern.match('/users/test'); // => null
```

##### make wildcard pattern from string

```javascript
var wildcardPattern = new Pattern('*/users/:id/*');
```

##### match wildcard pattern against url

wildcard matches are collected in the `_` property:

```javascript
wildcardPattern.match('/api/v1/users/10/followers/20');
// => {id: '10', _: ['/api/v1', 'followers/20']}
```

##### make optional pattern from string

```javascript
var optionalPattern = new Pattern('(/)users(/:foo)/bar(/*)');
```

##### match optional pattern against url

optional matches are stored in the corresponding property, if they exist.

```javascript
optionalPattern.match('users/bar');
// => {}
optionalPattern.match('/users/bar');
// => {}
optionalPattern.match('/users/biff/bar');
// => {foo: 'biff'}
optionalPattern.match('/users/biff/bar/beep/boop');
// => {foo: 'biff', _: ['beep/boop']}
```

### match domains

##### make pattern from string

```javascript
var pattern = new Pattern(':sub.google.com', '.');
```

the default separator is `/`. you can pass a custom separator
as the second argument to `Pattern`.

##### match pattern against domain

match returns the extracted parameters or `null` if there was no match:

```javascript
pattern.match('www.google.com'); // => {sub: 'www'}
pattern.match('www.google.io'); // => null
```

##### make pattern from regex

```javascript
var regexPattern = new Pattern(/example\.(.*)/);
```

##### match regex pattern against domain

if the pattern was created from a regex an array of the captured groups is returned on match:

```javascript
regexPattern.match('example.com'); // => ['com']
regexPattern.match('google.com'); // => null
```

##### make wildcard pattern from string

```javascript
var wildcardPattern = new Pattern('*.:sub.google.*');
```

##### match wildcard pattern against url

wildcard matches are collected in the `_` property:

```javascript
wildcardPattern.match('subsub.www.google.com');
// => {sub: 'www', _: ['subsub', 'com']}
```

### changelog

#### 0.7

instead of

``` js
var urlPattern = require('url-pattern');
var pattern = urlPattern.newPattern('/example');
```

now use

``` js
var Pattern = require('url-pattern');
var pattern = new Pattern('/example');
```
### contribution

**TLDR: bugfixes, issues and discussion are always welcome.
ask me before implementing new features.**

i will happily merge pull requests that fix bugs with reasonable code.

i will only merge pull requests that modify/add functionality
if the changes align with my goals for this package
and only if the changes are well written, documented and tested.

**communicate:** write an issue to start a discussion
before writing code that may or may not get merged.

### todo

- https://github.com/snd/url-pattern/issues/6
  - parse string into array of objects describing structure
    - constant
    - binding
    - wildcard
    - optional
  - multiple occurences of the same name are collected into an array
    - this elegantly normalizes * and :
  - binding parsing is flexible and has a start and end regex
    - default: `:` and `[^a-zA-Z0-9]
    - custom: `#{` and `}`
  - test that empty names are not allowed
- browser tests

## [license: MIT](LICENSE)
