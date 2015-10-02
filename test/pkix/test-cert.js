'use strict';

let fsp = require('fs-promise');
let temp = require('temp');
let assert = require('assert');
var concat = require('concat-stream');
let tar = require('tar-stream');
var stream = require('stream');

let config = require('../../config');
let ca = require('../../pkix/ca');
let cert = require('../../pkix/cert');


function extractTar(tarBuffer) {
  return new Promise(function(resolve, reject) {
    var tarData = {};

    let extract = tar.extract();
    extract.on('entry', function(header, stream, callback) {
      let fileName = header['name'];

      stream.on('end', function() {
        callback();
      });

      stream.pipe(concat(function(data) {
        if (fileName.match(/.key$/) || fileName.match(/.crt/)) {
          tarData[fileName] = data.toString();
        } else {
          reject('Invalid file: ' + fileName);
        }
      }));
    });

    extract.on('finish', function() {
      resolve(tarData);
    });

    var certStream = new stream.PassThrough();
    certStream.end(tarBuffer);
    certStream.pipe(extract);
  });
}


describe('pkix/cert', function() {
  before(function* () {
    temp.track(true);
    let tempDir = temp.mkdirSync();

    // Clone OpenSSL config to change dir =
    let opensslConf = yield fsp.readFile('openssl.conf');
    opensslConf = opensslConf.toString()
      .replace(/\ndir[ ]*=[ ]*.*/g, '\ndir = ' + tempDir);
    let confPath = tempDir + '/openssl.conf';
    yield fsp.writeFile(confPath, opensslConf);

    config.OPENSSL_CONF = confPath;
    config.KEY_STORAGE = tempDir;

    yield ca.setup();
  });

  it('generates server keys', function*() {
    let certTar = yield cert.generateServer('localhost', '127.0.0.1');
    let tarContents = yield extractTar(certTar);

    assert(Object.keys(tarContents).length === 2);

    assert(tarContents['server.key'].match(/^-----BEGIN RSA PRIVATE KEY-----/));
    assert(tarContents['server.crt'].match(/^-----BEGIN CERTIFICATE-----/));
  });

});