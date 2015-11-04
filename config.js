'use strict';

exports.KEY_SIZE = 4096;

exports.KEY_VALIDITY = 3650;
exports.KEY_STORAGE = '/tmp/cert-server';
exports.OPENSSL_CONF = process.env.OPENSSL_CONF;
exports.ENVIRONMENT = 'testing';
exports.CLIENT_SECURITY_GROUP = process.env.CLIENT_SECURITY_GROUP || 'sg-123456';
