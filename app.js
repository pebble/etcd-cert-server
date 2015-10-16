'use strict';

var koa = require('pebble-koa-server/koa');
var logger = require('pebble-koa-server/logger');
var resource = require('pebble-koa-server/resources');
var join = require('path').join;

var app = module.exports = koa();
logger.setupAppLogging(app);

resource(app, join(__dirname, 'resources'));
