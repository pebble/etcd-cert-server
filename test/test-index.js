'use strict';

let temp = require('temp');
let fsp = require('fs-promise');
let testSetup = require('./test-setup');
let supertest = require('supertest');
let assert = require('assert');
let sinon = require('sinon');
let config = require('../config');

describe('/v1/certs', function() {
  let httpServer;

  before(function*() {
    temp.track(true);
    let tempDir = temp.mkdirSync();

    // Clone OpenSSL config to temp dir:
    let opensslConf = yield fsp.readFile('openssl.conf');
    opensslConf = opensslConf.toString()
      .replace(/\ndir[ ]*=[ ]*.*/g, '\ndir = ' + tempDir);
    let confPath = tempDir + '/openssl.conf';
    yield fsp.writeFile(confPath, opensslConf);

    config.OPENSSL_CONF = confPath;
    config.KEY_STORAGE = tempDir;
    config.KEY_SIZE = 512;
    httpServer = (yield testSetup.setupServer()).server;
  });

  after(function*() {
    yield testSetup.teardownServer(httpServer);
  });

  beforeEach(function() {
    this.sinon = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sinon.restore();
  });

  describe('/ca', function() {
    it('returns certificate', function(done) {
      supertest(httpServer)
        .get('/v1/certs/ca')
        .expect(200)
        .expect('Content-Type', 'application/x-pem-file')
        .end(function(err, res) {
          if (err) {
            return done(err);
          }
          let certLines = res.text.split('\n');
          assert(certLines[0].match(/^-----BEGIN CERTIFICATE-----$/));
          assert(certLines[certLines.length - 2]
            .match(/^-----END CERTIFICATE-----$/));
          done();
        });
    });
  });

  describe('/certs/server', function() {
    it('returns certificates', function(done) {
      supertest(httpServer)
        .get('/v1/certs/server/test')
        .expect('Content-Type', 'application/x-tar')
        .expect(200, done);
    });
  });

  describe('/certs/client', function() {
    it('returns certificates', function(done) {
      supertest(httpServer)
        .get('/v1/certs/client/test')
        .expect('Content-Type', 'application/x-tar')
        .expect(200, done);
    });
  });

  describe('/certs/finalize', function() {
    it('finalizes connection', function(done) {

      // Stub out API calls:
      let securityGroups = require('../aws/securityGroup');
      this.sinon.stub(securityGroups, 'removeSecurityGroup', function() {
        return Promise.resolve(true);
      });

      supertest(httpServer)
        .get('/v1/certs/finalize')
        .expect(200, done);
    });
  });
});
