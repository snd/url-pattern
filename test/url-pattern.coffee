UrlPattern = require '../src/url-pattern'

module.exports =

#     'modifying the compiler': (test) ->
#       compiler = new UrlPattern.Compiler()
#       compiler.escapeChar = '!'
#       compiler.segmentNameStartChar = '$'
#       compiler.segmentNameCharset = 'a-zA-Z0-9_-'
#       compiler.segmentValueCharset = 'a-zA-Z0-9'
#       compiler.optionalSegmentStartChar = '['
#       compiler.optionalSegmentEndChar = ']'
#       compiler.wildcardChar = '?'
#
#       pattern = new UrlPattern(
#         '[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]'
#         compiler
#       )
#
#       test.deepEqual pattern.match('google.de'),
#         domain: 'google'
#         'toplevel-domain': 'de'
#       test.deepEqual pattern.match('http://mail.google.com/mail'),
#         sub_domain: 'mail'
#         domain: 'google'
#         'toplevel-domain': 'com'
#         _: 'mail'
#       test.equal pattern.match('http://mail.this-should-not-match.com/mail'), null
#       test.equal pattern.match('google'), null
#       test.deepEqual pattern.match('www.google.com'),
#         sub_domain: 'www'
#         domain: 'google'
#         'toplevel-domain': 'com'
#       test.deepEqual pattern.match('https://www.google.com'),
#         sub_domain: 'www'
#         domain: 'google'
#         'toplevel-domain': 'com'
#       test.equal pattern.match('httpp://mail.google.com/mail'), null
#       test.deepEqual pattern.match('google.de/search'),
#         domain: 'google'
#         'toplevel-domain': 'de'
#         _: 'search'
#       test.done()

  'named segment can have a static prefix': (test) ->
    pattern = new UrlPattern '/vvv:version/*'
    test.equal null, pattern.match('/vvv/resource')
    test.deepEqual pattern.match('/vvv1/resource'),
      _: 'resource'
      version: '1'
    test.equal null, pattern.match('/vvv1.1/resource'),
    test.done()

  'instance of UrlPattern is handled correctly as constructor argument': (test) ->
      pattern = new UrlPattern '/user/:userId/task/:taskId'
      copy = new UrlPattern pattern
      test.deepEqual copy.match('/user/10/task/52'),
        userId: '10'
        taskId: '52'
      test.done()

  # 'match full stops in segment values': (test) ->
  #     compiler = new UrlPattern.Compiler()
  #     compiler.segmentValueCharset = 'a-zA-Z0-9-_ %.'
  #     pattern = new UrlPattern '/api/v1/user/:id/', compiler
  #     test.deepEqual pattern.match('/api/v1/user/test.name/'),
  #       id: 'test.name'
  #     test.done()
