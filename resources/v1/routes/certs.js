'use strict';

var config = require('../../../config');
var ca = require('../../../pkix/ca');
var cert = require('../../../pkix/cert');
var ec2 = require('../../../aws/securityGroup');

function getIp() {
  return this.request.ip
    .replace(/^.*:/, '');
}

exports.createServerCertificate = function*() {
  let ip = getIp.call(this);
  let name = this.request.params.name;

  this.body = yield cert.generateServerKeysTar(name, ip);
  this.type = 'application/x-tar';
};

exports.createClientCertificate = function*() {
  var name = this.request.params.name;

  this.body = yield cert.generateClientKeysTar(name);
  this.type = 'application/x-tar';
};

exports.getCaCertificate = function*() {
  this.body = yield ca.getCertificate();
  this.type = 'application/x-pem-file';
};

exports.finalize = function*() {
  let ip = getIp.call(this);
  yield ec2.removeSecurityGroup(ip, config.CLIENT_SECURITY_GROUP);
  this.body = '';
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
    method: 'post',
    path: '/certs/server/:name',
    handler: [
      exports.createServerCertificate
    ]
  });

  router.route({
    method: 'post',
    path: '/certs/client/:name',
    handler: [
      exports.createClientCertificate
    ]
  });

  router.route({
    method: 'post',
    path: '/certs/finalize',
    handler: [
      exports.finalize
    ]
  });
};

