var runMain = require('pebble-koa-server');

var fs = require('fs');
var app = require('./app');
var config = require('./config');

var ca = require('./pkix/ca');

runMain(function* setupApp() {
    yield ca.setup();

    // Do any additional app setup here
    return app;
});