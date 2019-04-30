import test from "tape";

import UrlPattern from "../dist/url-pattern.js";

test('simple', function(t) {
  const pattern = new UrlPattern('/api/users/:id');
  t.deepEqual(pattern.match('/api/users/10'), {id: '10'});
  t.equal(pattern.match('/api/products/5'), undefined);
  t.end();
});

test('api versioning', function(t) {
  const pattern = new UrlPattern('/v:major(.:minor)/*');
  t.deepEqual(pattern.match('/v1.2/'), {major: '1', minor: '2', _: ''});
  t.deepEqual(pattern.match('/v2/users'), {major: '2', _: 'users'});
  t.equal(pattern.match('/v/'), undefined);
  t.end();
});

test('domain', function(t) {
  const pattern = new UrlPattern('(http(s)\\://)(:subdomain.):domain.:tld(\\::port)(/*)');
  t.deepEqual(pattern.match('google.de'), {
    domain: 'google',
    tld: 'de'
  }
  );
  t.deepEqual(pattern.match('https://www.google.com'), {
    subdomain: 'www',
    domain: 'google',
    tld: 'com'
  }
  );
  t.deepEqual(pattern.match('http://mail.google.com/mail'), {
    subdomain: 'mail',
    domain: 'google',
    tld: 'com',
    _: 'mail'
  }
  );
  t.deepEqual(pattern.match('http://mail.google.com:80/mail'), {
    subdomain: 'mail',
    domain: 'google',
    tld: 'com',
    port: '80',
    _: 'mail'
  }
  );
  t.equal(pattern.match('google'), undefined);

  t.deepEqual(pattern.match('www.google.com'), {
    subdomain: 'www',
    domain: 'google',
    tld: 'com'
  }
  );
  t.equal(pattern.match('httpp://mail.google.com/mail'), undefined);
  t.deepEqual(pattern.match('google.de/search'), {
    domain: 'google',
    tld: 'de',
    _: 'search'
  }
  );

  t.end();
});

test('named segment occurs more than once', function(t) {
  const pattern = new UrlPattern('/api/users/:ids/posts/:ids');
  t.deepEqual(pattern.match('/api/users/10/posts/5'), {ids: ['10', '5']});
  t.end();
});

test('regex', function(t) {
  const pattern = new UrlPattern(/^\/api\/(.*)$/);
  t.deepEqual(pattern.match('/api/users'), ['users']);
  t.equal(pattern.match('/apiii/users'), undefined);
  t.end();
});

test('regex group names', function(t) {
  const pattern = new UrlPattern(/^\/api\/([^\/]+)(?:\/(\d+))?$/, ['resource', 'id']);
  t.deepEqual(pattern.match('/api/users'),
    {resource: 'users'});
  t.equal(pattern.match('/api/users/'), undefined);
  t.deepEqual(pattern.match('/api/users/5'), {
    resource: 'users',
    id: '5'
  }
  );
  t.equal(pattern.match('/api/users/foo'), undefined);
  t.end();
});

test('stringify', function(t) {
  let pattern = new UrlPattern('/api/users/:id');
  t.equal('/api/users/10', pattern.stringify({id: 10}));

  pattern = new UrlPattern('/api/users(/:id)');
  t.equal('/api/users', pattern.stringify());
  t.equal('/api/users/10', pattern.stringify({id: 10}));

  t.end();
});

test('customization', function(t) {
  const options = {
    escapeChar: '!',
    segmentNameStartChar: '$',
    segmentNameCharset: 'a-zA-Z0-9_-',
    segmentValueCharset: 'a-zA-Z0-9',
    optionalSegmentStartChar: '[',
    optionalSegmentEndChar: ']',
    wildcardChar: '?'
  };

  const pattern = new UrlPattern(
    '[http[s]!://][$sub_domain.]$domain.$toplevel-domain[/?]',
    options
  );

  t.deepEqual(pattern.match('google.de'), {
    domain: 'google',
    'toplevel-domain': 'de'
  }
  );
  t.deepEqual(pattern.match('http://mail.google.com/mail'), {
    sub_domain: 'mail',
    domain: 'google',
    'toplevel-domain': 'com',
    _: 'mail'
  }
  );
  t.equal(pattern.match('http://mail.this-should-not-match.com/mail'), undefined);
  t.equal(pattern.match('google'), undefined);
  t.deepEqual(pattern.match('www.google.com'), {
    sub_domain: 'www',
    domain: 'google',
    'toplevel-domain': 'com'
  }
  );
  t.deepEqual(pattern.match('https://www.google.com'), {
    sub_domain: 'www',
    domain: 'google',
    'toplevel-domain': 'com'
  }
  );
  t.equal(pattern.match('httpp://mail.google.com/mail'), undefined);
  t.deepEqual(pattern.match('google.de/search'), {
    domain: 'google',
    'toplevel-domain': 'de',
    _: 'search'
  }
  );
  t.end();
});
