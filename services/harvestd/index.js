/*
	harvestd daemon entry point
*/
var _ = require('lodash');
var q = require('q');

var config = require('../config');
var baseStore = require('./modules/api/store');
var elasticsearchStore = require('./modules/api/elasticsearchStore');


var logwrangler = require('logwrangler');

// express related stuff
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');

var expressWrangler = require('express-wrangler');

exports.Store = baseStore;
exports.ESStore = elasticsearchStore;

exports.create = function(options){
	options = options || {};

	logger = options.logger || logwrangler.create();

	var Store = options.store || new elasticsearchStore.create(config.elasticsearch);

	if(options.config){
		config.server = _.extend(_.cloneDeep(config.server), options.config);
	}

	var server = options.server || express();
	server.use(bodyParser());
	server.use(cookieParser({
		domain: config.server.cookieDomain,
		secure: config.server.cookieSecure,
		maxAge: config.server.cookieMaxAge,
		httpOnly: config.server.cookieHttpOnly,
		path: config.server.cookiePath
	}));

	server.use(expressWrangler({
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

	var allowCORS = config.server.allowCORS;
	if((_.isString(allowCORS) && allowCORS == 'true') || allowCORS  === true){
		server.use(function(req, res, next){
			res.set('Access-Control-Allow-Origin', '*');
			next();
		});
	}

	var startServer = function(port){
		server.listen(port || config.server.port);
		logger.log({
			level: logger.levels.INFO,
			type: logger.types.SUCCESS,
			ns: 'harvestd-server',
			message: 'Server started on port ' + config.server.port
		});
	};


	require('./modules/api/routes')(server, config, Store);
	require('./modules/client/routes')(server, config, Store);

	return {
		server: server,
		start: startServer
	};
};



