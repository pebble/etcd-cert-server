var runMain = require('pebble-koa-server');
var app = require('./app');

runMain(function* setupApp() {
    // Do any additional app setup here
    return app;
});