'use strict';

let fsp = require('fs-promise');
let concat = require('concat-stream');
let tar = require('tar-stream');
let openssl = require('./openssl');
let config = require('../config');

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

function* generateCertPair(name, ip, type) {
  let serverCsr = config.KEY_STORAGE + '/csr/' + name + '-' + type + '.pem';

  let files = {};
  files[type + '.key'] = yield generateKey(name, serverCsr, type);
  files[type + '.crt'] = yield signCertificate(serverCsr, ip, 'etcd_' + type);
  return files;
}

function sanitizeName(name) {
  return name.replace(/[^\w]/g, '');
}

exports.generateServerKeysTar = function* (name, ip) {
  name = sanitizeName(name);

  let serverKeyPair = yield generateCertPair(name, ip, 'server');
  let peerKeyPair = yield generateCertPair(name, ip, 'peer', serverKeyPair);
  let keyPairs = Object.assign({}, serverKeyPair, peerKeyPair);

  return tarFiles(keyPairs);
};

exports.generateClientKeysTar = function* (name) {
  name = sanitizeName(name);

  var clientKeyPair = yield generateCertPair(name, '', 'client');

  return tarFiles(clientKeyPair);
};
