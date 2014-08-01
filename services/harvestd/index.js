/*
	harvestd daemon entry point
*/
var _ = require('lodash');
var q = require('q');

var config = require('../config');
var elasticsearchStore = require('./modules/api/elasticsearchStore');

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
server.use(middlewares.requestLogger({
	logger: logger
}));

server.use(function(req, res, next){

	res.handleError = function(error, data){
		res.responseError = {
			error: error,
			data: data
		};

		res.json((error && error.type && error.type.statusCode || 500), {
			error: error,
			data: data
		});
	};
	next();
});

var startServer = function(){
	server.listen(config.server.port);
	logger.log({
		level: logger.levels.INFO,
		type: logger.types.SUCCESS,
		ns: 'harvestd-server',
		message: 'Server started on port ' + config.server.port
	});
};

var Store = new elasticsearchStore.create(config.elasticsearch);


require('./modules/api/routes')(server, config, Store);

startServer();



