'use strict';

var fsp = require('fs-promise');
var concat = require('concat-stream');
var tar = require('tar-stream');
var openssl = require('./openssl');
var config = require('../config');


function* generateKey(name, serverCsr) {
  let serverSubject = '/O=Pebble/OU=' + config.ENVIRONMENT + '/CN=' + name;

  // We'd rather capture this from stdout
  // But: https://stackoverflow.com/questions/28471248/
  let serverKey = config.KEY_STORAGE + '/private/' + name + '.key';

  yield openssl(['req',
    '-new',
    '-newkey', 'rsa:' + config.KEY_SIZE,
    '-days', config.KEY_VALIDITY,
    '-nodes',
    '-out', serverCsr,
    '-keyout', serverKey,
    '-subj', serverSubject
  ]);
  let serverKeyData = yield fsp.readFile(serverKey);
  yield fsp.unlink(serverKey);
  return serverKeyData;
}


exports.generateServer = function* (name, ip) {
  name = name.replace(/[^\w]/g, '');

  let serverCsr = config.KEY_STORAGE + '/csr/' + name + '.pem';

  // Generate key+CSR, read back and destroy key.
  let serverKeyData = yield generateKey(name, serverCsr);

  // Sign the cert with the CA:
  let signCsr = yield openssl(['ca',
    '-in', serverCsr,
    '-config', config.OPENSSL_CONF,
    '-notext',
    '-extensions', 'etcd_server',
    '-batch'
  ], ip);

  return new Promise(function(resolve, reject) {
    let pack = tar.pack();
    let serverCert = signCsr.stdout.toString();

    pack.entry({'name': 'server.key', mode: 0o600}, serverKeyData);
    pack.entry({'name': 'server.crt', mode: 0o660}, serverCert);

    pack.finalize();

    pack.pipe(concat(function(fullTar) {
      resolve(fullTar);
    }));
  });
};

