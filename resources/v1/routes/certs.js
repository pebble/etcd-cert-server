'use strict';

var config = require('../../../config');
var ca = require('../../../pkix/ca');
var server = require('../../../pkix/server');

exports.createServerCertificate = function*(next) {
  // ipv4 source IP:
  var ip = this.request.ip
    .replace(/^.*:/, '');
  var name = this.request.params.name;

  this.body = yield server.generateServer(name, ip);
  this.type = 'application/x-tar';
  yield* next;
};

exports.getCaCertificate = function*(next) {
  this.body = yield ca.getCertificate();
  this.type = 'application/x-pem-file';
  yield* next;
};


exports.setupCertRoutes = function (router) {
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
};

