# url-pattern

[![Build Status](https://travis-ci.org/snd/url-pattern.png)](https://travis-ci.org/snd/url-pattern)

url-pattern is easy pattern matching and segment extraction for
urls, domains, filepaths and any string composed of segments joined
by a seperator character

[if you are looking for simple composable routing (url matching and dispatch)
that builds on top of url-pattern - check out passage](https://github.com/snd/passage)

- [install](#install)
- [match urls or filepaths](#match-urls-or-filepaths)
- [match domains](#match-domains)
- [license](#match-domains)

### install

```
npm install url-pattern
```

**or**

put this line in the dependencies section of your `package.json`:

```
"url-pattern": "0.5.0"
```

then run:

```
npm install
```

### require

```javascript
var urlPattern = require('url-pattern');
```

### match urls or filepaths

##### make pattern from string

```javascript
var pattern = urlPattern.newPattern('/users/:id');
```

the default separator is `/`. you can pass a custom separator
as the second argument to `newPattern`.

##### match pattern against url

match returns the extracted parameters or `null` if there was no match:

```javascript
pattern.match('/users/5'); // => {id: '5'}
pattern.match('/projects/5'); // => null
```

##### make pattern from regex

```javascript
var regexPattern = urlPattern.newPattern(/\/test\/(.*)/);
```

##### match regex pattern against url

if the pattern was created from a regex an array of the captured groups is returned on match:

```javascript
regexPattern.match('/test/users'); // => ['users']
regexPattern.match('/users/test'); // => null
```

##### make wildcard pattern from string

```javascript
var wildcardPattern = urlPattern.newPattern('*/users/:id/*');
```

##### match wildcard pattern against url

wildcard matches are collected in the `_` property:

```javascript
wildcardPattern.match('/api/v1/users/10/followers/20');
// => {id: '10', _: ['/api/v1', 'followers/20']}
```

### match domains

##### make pattern from string

```javascript
var pattern = urlPattern.newPattern(':sub.google.com', '.');
```

the default separator is `/`. you can pass a custom separator
as the second argument to `newPattern`.

##### match pattern against domain

match returns the extracted parameters or `null` if there was no match:

```javascript
pattern.match('www.google.com'); // => {sub: 'www'}
pattern.match('www.google.io'); // => null
```

##### make pattern from regex

```javascript
var regexPattern = urlPattern.newPattern(/example\.(.*)/);
```

##### match regex pattern against domain

if the pattern was created from a regex an array of the captured groups is returned on match:

```javascript
regexPattern.match('example.com'); // => ['com']
regexPattern.match('google.com'); // => null
```

##### make wildcard pattern from string

```javascript
var wildcardPattern = urlPattern.newPattern('*.:sub.google.*');
```

##### match wildcard pattern against url

wildcard matches are collected in the `_` property:

```javascript
wildcardPattern.match('subsub.www.google.com');
// => {sub: 'www', _: ['subsub', 'com']}
```

### license: MIT
