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

#### 0.9

named segments now also match `-`, `_`, ` ` and `%`.

`\\` can now be used to escape characters.

[made all special chars and charsets used in parsing configurable.](#modifying-the-compiler)

added [bower.json](bower.json) and registered with bower as `url-pattern`.

#### 0.10

named segments are now called keys

unnamed wildcards no longer work

`*` must now be followed by at least one alphanumeric character

multiple occurences of the same key are no longer allowed
