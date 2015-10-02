// FIXME: weak for quick dev
exports.KEY_SIZE = 1024;

exports.KEY_VALIDITY = 3650;
exports.KEY_STORAGE = '/tmp/cert-server';
exports.OPENSSL_CONF = process.env.OPENSSL_CONF || '/Users/pwagner/git/etcd-cert-server/openssl.conf';
exports.ENVIRONMENT = 'testing';

