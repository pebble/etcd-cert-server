'use strict';

let fs = require('fs');
let temp = require('temp');
let assert = require('assert');

let config = require('../../config');
let ca = require('../../pkix/ca');

describe('pkix/ca', function() {
  var tempDir;

  beforeEach(function() {
    temp.track(true);

    tempDir = temp.mkdirSync();
    config.KEY_STORAGE = tempDir;
    config.KEY_SIZE = 512;
  });

  it('sets up cert directory', function* () {
    yield ca.setupDir();

    assert(fs.lstatSync(tempDir + '/certs').isDirectory());
    assert(fs.lstatSync(tempDir + '/newcerts').isDirectory());
    assert(fs.lstatSync(tempDir + '/index.txt').isFile());
  });

  it('handles broken existing tree', function* () {
    fs.writeFileSync(tempDir + '/certs', '');

    try {
      yield ca.setupDir();
    } catch (err) {
      assert(err.message.match(/is not a directory/));
    }
  });

  it('generates CA root', function* () {
    yield ca.setupDir();
    yield ca.generateCaCert();

    assert(fs.lstatSync(tempDir + '/certs/ca.pem').isFile());
    assert(fs.lstatSync(tempDir + '/private/ca.key').isFile());
  });

  it('exports CA certificate', function* () {
    yield ca.setup();

    let certificate = yield ca.getCertificate();
    let certLines = certificate.toString().split('\n');
    assert(certLines[0] === '-----BEGIN CERTIFICATE-----');
    assert(certLines[certLines.length - 2] === '-----END CERTIFICATE-----');
  });

});
