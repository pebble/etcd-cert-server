'use strict';

let runMain = require('pebble-koa-server');

let app = require('./app');
let ca = require('./pkix/ca');

let setupApp = module.exports = function*() {
  yield ca.setup();

  // Do any additional app setup here
  return app;
};

runMain(setupApp);
