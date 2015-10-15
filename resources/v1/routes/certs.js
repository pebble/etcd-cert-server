'use strict';

var config = require('../../../config');
var ca = require('../../../pkix/ca');
var cert = require('../../../pkix/cert');
var ec2 = require('../../../aws/securityGroup');

function getIp() {
  var ip = this.request.ip
    .replace(/^.*:/, '');
  return ip;
}
exports.createServerCertificate = function*(next) {
  var ip = getIp.call(this);
  var name = this.request.params.name;

  this.body = yield cert.generateServer(name, ip);
  this.type = 'application/x-tar';
  yield* next;
};

exports.createClientCertificate = function*(next) {
  var name = this.request.params.name;

  this.body = yield cert.generateClient(name);
  this.type = 'application/x-tar';
  yield* next;
};

exports.getCaCertificate = function*(next) {
  this.body = yield ca.getCertificate();
  this.type = 'application/x-pem-file';
  yield* next;
};

exports.finalize = function*(next) {
  var ip = getIp.call(this);
  yield ec2.removeSecurityGroup(ip, config.CLIENT_SECURITY_GROUP);
  this.body = '';
  yield* next;
};

exports.setupCertRoutes = function(router) {
  router.route({
    method: 'get',
    path: '/certs/ca',
    handler: [
      exports.getCaCertificate
    ]
  });

  router.route({
    method: 'get',
    path: '/certs/server/:name',
    handler: [
      exports.createServerCertificate
    ]
  });

  router.route({
    method: 'get',
    path: '/certs/client/:name',
    handler: [
      exports.createClientCertificate
    ]
  });

  router.route({
    method: 'get',
    path: '/certs/finalize',
    handler: [
      exports.finalize
    ]
  });
};

