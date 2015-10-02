'use strict';

var assert = require('assert');

var openssl = require('../../pkix/openssl');

describe('pkix/openssl', function() {
  it('wraps OpenSSL', function* () {
    let opensslCmd = yield openssl(['version']);
    let opensslVersion = opensslCmd.stdout.toString();
    assert(opensslVersion.match(/^OpenSSL [0-9]/));
  });
});