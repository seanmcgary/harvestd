/*
	harvestd daemon entry point
*/
var _ = require('lodash');
var q = require('q');

var config = require('../config');

var logwrangler = require('logwrangler');
var logger = logwrangler.create();

// express related stuff
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var middlewares = config.requireLib('/modules/middlewares');


var server = express();
server.use(bodyParser.json());
server.use(cookieParser());

var startServer = function(){
	server.listen(config.server.port);
	logger.log({
		level: logger.levels.INFO,
		type: logger.types.SUCCESS,
		ns: 'harvestd-server',
		message: 'Server started on port ' + config.server.port
	});
};

startServer();



