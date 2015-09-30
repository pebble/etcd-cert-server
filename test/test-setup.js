'use strict';

require('co-mocha');


exports.setupServer = function* () {
  let serverConfig = require('pebble-koa-server/config');
  let setupApp = require('../server');
  let startWorker = require('pebble-koa-server/worker');

  serverConfig.PORT = 0;

  var app = yield setupApp();
  var server = yield startWorker(app);

  return {
    app: app,
    server: server
  };
};

exports.teardownServer = function(server) {
  return function(cb) {
    server.close(cb);
  };
};
