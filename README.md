# url-pattern

[![Build Status](https://travis-ci.org/snd/url-pattern.png)](https://travis-ci.org/snd/url-pattern)

url-pattern matches urls with patterns and extracts named url segments

if you are looking for simple composable routing that builds on top of url-pattern [check out passage](https://github.com/snd/passage)

### install

```
npm install url-pattern
```

**or**

put this line in the dependencies section of your `package.json`:

```
"url-pattern": "0.4.0"
```

then run:

```
npm install
```

### use

##### require

```javascript
var newUrlPattern = require('url-pattern');
```

##### make pattern from string

```javascript
var pattern = newUrlPattern('/users/:id');
```

##### match pattern against url

match returns the extracted parameters or `null` if there was no match:

```javascript
pattern.match('/users/5'); // => {id: '5'}
pattern.match('/projects/5'); // => null
```

##### make pattern from regex

```javascript
var regexPattern = newUrlPattern(/\/test\/(.*)/);
```

##### match regex pattern against url

if the pattern was created from a regex an array of the captured groups is returned on match:

```javascript
regexPattern.match('/test/users'); // => ['users']
regexPattern.match('/users/test'); // => null
```

##### make wildcard pattern from string

```javascript
var wildcardPattern = newUrlPattern('*/users/:id/*');
```

##### match wildcard pattern against url

wildcard matches are collected in the `_` property:

```javascript
wildcardPattern.match('/api/v1/users/10/followers/20');
// => {id: '10', _: ['/api/v1', 'followers/20']}
```

### pattern examples

`/users` will match exactly `/users`

`/projects/:projectId/supporters/:supporterId` will match any url where the first
segment is `projects`, the second segment is not empty, the third segment is
`supporters` and the fourth segment is not empty. the second and fourth segments will be bound
to `projectId` and `supporterId`

`/projects/*` will match any url which begins with `/projects/`

`*/projects` will match any url which ends with `/projects`

`/users/*/projects` will match any url which starts with `/users/` and ends with `/projects`

### license: MIT
