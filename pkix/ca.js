'use strict';

var fsp = require('fs-promise');
var config = require('../config');
var openssl = require('./openssl');

/**
 * Safe mkdir.
 */
function mkdir(path) {
  return fsp.lstat(path)
    .then(function(stat) {
      if (!stat.isDirectory()) {
        throw new Error(path + ' is not a directory');
      }
    })
    .catch(function(e) {
      if (e.code === 'ENOENT') {
        return fsp.mkdir(path, 0o770);
      }
      throw e;
    });
}

function getCaCertPath() {
  return config.KEY_STORAGE + '/certs/ca.pem';
}

exports.setupDir = function() {
  return mkdir(config.KEY_STORAGE)
    .then(function() {
      return Promise.all([
        mkdir(config.KEY_STORAGE + '/certs'),
        mkdir(config.KEY_STORAGE + '/csr'),
        mkdir(config.KEY_STORAGE + '/newcerts'),
        mkdir(config.KEY_STORAGE + '/private')
      ]);
    })
    .then(function() {
      return Promise.all([
        fsp.writeFile(config.KEY_STORAGE + '/index.txt', ''),
        fsp.writeFile(config.KEY_STORAGE + '/index.txt.attr', ''),
        fsp.writeFile(config.KEY_STORAGE + '/serial', '1000')
      ]);
    });
};

exports.generateCaCert = function() {
  let caSubject = '/O=Pebble/OU=' + config.ENVIRONMENT + '/CN=Cert Authority';
  let caCert = getCaCertPath();
  let caKey = config.KEY_STORAGE + '/private/ca.key';

  return openssl(['req',
    '-new',
    '-x509',
    '-newkey', 'rsa:' + config.KEY_SIZE,
    '-days', config.KEY_VALIDITY,
    '-nodes',
    '-out', caCert,
    '-keyout', caKey,
    '-extensions', 'v3_ca',
    '-subj', caSubject
  ]);
};

exports.setup = function() {
  return exports.setupDir()
    .then(exports.generateCaCert);
};

exports.getCertificate = function() {
  let caCert = getCaCertPath();
  return fsp.readFile(caCert);
};
