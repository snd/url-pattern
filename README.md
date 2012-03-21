# url-pattern

match urls to patterns and extract named url segments

## Installation

```
npm install git://github.com/snd/url-pattern.git
```

## Usage

### make a pattern from a string

```coffeescript
Pattern = require 'url-pattern'

pattern = new Pattern '/users/:id'
```

### match a pattern against a url

```coffeescript
pattern.match '/projects/5' # => null
pattern.match '/users/5' # => {id: 5}
```

match returns either `null`, if there was no match, or an object with the named parameters.

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
