'use strict';

var fsp = require('fs-promise');
var concat = require('concat-stream');
var tar = require('tar-stream');
var openssl = require('./openssl');
var config = require('../config');

function* generateKey(name, csrPath, type) {
  let certSubject = '/O=Pebble/OU=' + config.ENVIRONMENT +
    '/CN=' + name + ' ' + type;

  // We'd rather capture this from stdout
  // But: https://stackoverflow.com/questions/28471248/
  let keyPath = config.KEY_STORAGE + '/private/' + name + '.key';

  yield openssl(['req',
    '-new',
    '-newkey', 'rsa:' + config.KEY_SIZE,
    '-days', config.KEY_VALIDITY,
    '-nodes',
    '-out', csrPath,
    '-keyout', keyPath,
    '-subj', certSubject
  ]);

  try {
    let keyData = yield fsp.readFile(keyPath);
    return keyData;
  } finally {
    yield fsp.unlink(keyPath);
  }
}

function* signCertificate(csrPath, ip, extensions) {
  var signedCert = yield openssl(['ca',
    '-in', csrPath,
    '-config', config.OPENSSL_CONF,
    '-notext',
    '-extensions', extensions,
    '-batch'
  ], ip);
  return signedCert.stdout.toString();
}

function tarFiles(tarMap) {
  return new Promise(function(resolve) {
    let pack = tar.pack();

    for (let filename of Object.keys(tarMap)) {
      let mode = 0o660;
      if (filename.match(/.key$/)) {
        mode = 0o600;
      }
      pack.entry({'name': filename, mode: mode}, tarMap[filename]);
    }

    pack.finalize();

    pack.pipe(concat(function(fullTar) {
      resolve(fullTar);
    }));
  });
}

function* generateCertPair(name, ip, type, tarMap) { // eslint-disable-line
  let serverCsr = config.KEY_STORAGE + '/csr/' + name + '-' + type + '.pem';

  tarMap[type + '.key'] = yield generateKey(name, serverCsr, type);
  tarMap[type + '.crt'] = yield signCertificate(serverCsr, ip, 'etcd_' + type);
}

exports.generateServer = function* (name, ip) {
  name = name.replace(/[^\w]/g, '');
  var tarMap = {};

  yield generateCertPair(name, ip, 'server', tarMap);
  yield generateCertPair(name, ip, 'peer', tarMap);

  return tarFiles(tarMap);
};

exports.generateClient = function* (name) {
  name = name.replace(/[^\w]/g, '');
  var tarMap = {};

  yield generateCertPair(name, '', 'client', tarMap);

  return tarFiles(tarMap);
};
