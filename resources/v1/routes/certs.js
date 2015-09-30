'use strict';

var config = require('../../../config');
var exec = require('co-exec');

exports.createServerCertificate = function*(next) {
    // ipv4 source IP:
    var ip = this.request.ip
        .replace(/^.*:/, '');
    var name = this.request.params.name;
    // TODO: how to deal with hostname conflicts without giving keys away
    // to anyone that asks

    try {
        // Generate certificate:
        yield exec('etcd-ca new-cert --passphrase ""'
            + ' --ip ' + ip
            + ' --domain ' + name
            + ' ' + name);
        yield exec('etcd-ca sign --passphrase "" ' + name);
    } catch (e) {
        // Most likely existing cert
        console.log(e);
    }

    this.body = yield exec('etcd-ca export --insecure --passphrase "" ' + name);
    this.type = 'application/x-tar';
    yield* next;
};

exports.getCaCertificate = function*(next) {
    var caCert = yield exec('etcd-ca chain');

    // Remove leading cruft
    this.body = caCert.slice(caCert.indexOf('----'));
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

