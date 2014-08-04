var _ = require('lodash');
var q = require('q');
var config = require('../../../config');
var fs = require('fs');

var errorTypes = config.requireLib('/modules/errorTypes').types;
var ApiError = config.requireLib('/modules/errorTypes').ApiError;

module.exports = function(server, config, Store){

	var testClient = fs.readFileSync(__dirname + '/testClient.html').toString();
	var jsClient = fs.readFileSync(__dirname + '/client.js').toString();

	server.get('/js/client.js', function(req, res){

		res.set('Content-Type', 'text/javascript');
		res.send(jsClient);
	});

	server.get('/testClient', function(req, res){
		var template = _.template(testClient);
		res.send(template());
	});

};