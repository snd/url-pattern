# url-pattern

match urls with patterns and extract named url segments

### Install

```
npm install url-pattern
```

### Use

#### Require

```coffeescript
Pattern = require 'url-pattern'
```

#### Make from string

```coffeescript
pattern = new Pattern '/users/:id'
```

#### Make from regex

```coffeescript
regexPattern = new Pattern /\/foo\/(.*)/
```

#### Match against url

```coffeescript
pattern.match '/projects/5' # => null
pattern.match '/users/5' # => {id: '5'}
pattern.match '/users/foo' # => {id: 'foo'}
```

match returns `null` if there was no match and the extracted parameters otherwise

#### Match regex pattern against url

```coffeescript
regexPattern.match '/users/foo' # => null
regexPattern.match '/foo/' # => ['']
regexPattern.match '/foo/bar' # => ['bar']
```

if the pattern was created from a regex an array of the captured groups is returned on match.

### Possible patterns

`/users` will match exactly `/users`

`/projects/:projectId/supporters/:supporterId` will match any url where the first
segment (url part delimited by `/`) is exactly `projects`, the second segment is not empty, the third segment is exactly
`supporters` and the fourth segment is not empty. the second and fourth segments will be bound
to `projectId` and `supporterId`

`/projects/*` will match any url which begins with `/projects/`

`*/projects` will match any url which ends with `/projects`

`/users/*/projects` will match any url which starts with `/users/` and ends with `/projects`

### License: MIT
