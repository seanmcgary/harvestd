var Store = require('../store');
var q = require('q');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');

var client;
var createConnection = function(config, forceCreate){
	var deferred = q.defer();

	if(client && !forceCreate){
		clientPromise = q.resolve(client);
	} else {
		client = new elasticsearch.Client({
			host: [config.host, config.port].join(':'),
			apiVersion: config.apiVersion
		});
		clientPromise = q.resolve(client);
	}


	clientPromise
	.then(function(){
		deferred.resolve();
	}, function(){
		deferred.reject();
	});

	return {
		ready: deferred.promise,
		client: client
	}
};

function ESStore(config){
	config = config || {};

	var client = createConnection(config);

	this.ready = client.ready;
	this.client = client.client;
};

ESStore.prototype = Store.prototype;

ESStore.prototype.track = function(token, event, data){
	var self = this;

	console.log(arguments);

	return this.ready.then(function(){
		return q.resolve();
	});
};

ESStore.prototype.identify = function(token, from, to){
	var self = this;

	console.log(arguments);

	return this.ready.then(function(){
		return q.resolve();
	});
};

exports.ESStore = ESStore;
exports.create = function(config){
	return new ESStore(config);
};

