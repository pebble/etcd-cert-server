'use strict';

let runMain = require('pebble-koa-server');
let fs = require('fs');

let app = require('./app');
let config = require('./config');
let ca = require('./pkix/ca');

let setupApp = module.exports = function*() {
  yield ca.setup();

  // Do any additional app setup here
  return app;
};

runMain(setupApp);