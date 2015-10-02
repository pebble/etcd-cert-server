'use strict';

var spawn = require('child-process-promise').spawn;

module.exports = function openssl(params, ip) {
    ip = ip || '';
    let options = {
        'capture': ['stdout', 'stderr'],
        'env': {
            'SAN': 'IP:' + ip
        }
    };

    return spawn('openssl', params, options);
};