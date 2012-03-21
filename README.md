# url-pattern

match urls to patterns and extract named url segments

## Installation

```
npm install git://github.com/snd/url-pattern.git
```

## Usage

### require it

```coffeescript
Pattern = require 'url-pattern'
```

### make a pattern from a string

```coffeescript
pattern = new Pattern '/users/:id'
```

### make a pattern from a regex

```coffeescript
regexPattern = new Pattern /\/foo\/(.*)/
```

### match a pattern against a url

```coffeescript
pattern.match '/projects/5' # => null
pattern.match '/users/5' # => {id: '5'}
pattern.match '/users/foo' # => {id: 'foo'}
```

match returns either `null`, if there was no match, or the named parameters.

### match a regex pattern against a url

```coffeescript
regexPattern.match '/users/foo' # => null
regexPattern.match '/foo/' # => ['']
regexPattern.match '/foo/bar' # => ['bar']
```

if the pattern was created from a regex an array of the captured groups is returned on match.

## Pattern examples

`/users` will match exactly the url `/users`

`/projects/:projectId/supporters/:supporterId` will match any url where the first
segment (url part delimited by `/`) is exactly `projects`, the second segment is not empty, the third segment is exactly
`supporters` and the fourth segment is not empty. the second and fourth segments will be bound
to `projectId` and `supporterId`

`/projects/*` will match any url which begins with `/projects/`

`*/projects` will match any url which ends with `/projects`

`/users/*/projects` will match any url which starts with `/users/` and ends with `/projects`

## License

url-pattern is released under the MIT License (see LICENSE for details).
