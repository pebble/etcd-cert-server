'use strict';

let runMain = require('pebble-koa-server');

function* setupApp() {
  let app = require('./app');
  let ca = require('./pkix/ca');

  yield ca.setup();

  // Do any additional app setup here
  return app;
}

/* istanbul ignore next */
if (!module.parent) {
  runMain(setupApp, {
    appName: require('./package.json').name
  });
} else {
  module.exports = setupApp;
}
