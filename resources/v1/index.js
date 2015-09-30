'use strict';

var router = module.exports = require('pebble-koa-server/router')();

var certs = require('./routes/certs.js');

certs.setupCertRoutes(router);