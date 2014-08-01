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

function ESStore(esConfig){
	var config = this.config = (esConfig || {});

	var client = createConnection(config);

	this.ready = client.ready;
	this.es = client.client;
};

ESStore.prototype = Store.prototype;

// converts everything to camel case
ESStore.prototype.transformKeys = function(data){
	_.each(data, function(val, key){
		if(key.match(/[_\s-]+/ig)){
			var parts = key.split(/[_\s-]/g);

			_.each(parts, function(part, index){
				part = part.toLowerCase();
				if(index){
					var newKey = part;

					part = (newKey[0].toUpperCase() + newKey.substr(1));
				}
				parts[index] = part;
			});

			parts = parts.join('');

			data[parts] = val;
			delete data[key];
		}
	});
	return data;
};

ESStore.prototype.track = function(token, event, data){
	var self = this;

	data = self.formatAttribute(data);
	if(!data.$userId){
		data.$userId = data.$uuid;
	}

	data.$ts = Date.now();
	data.$tsDate = new Date(data.$ts).toISOString();

	data = self.transformKeys(data);


	return self.ready.then(function(){
		return self.es.create({
			index: self.config.index,
			type: self.config.type,
			body: {
				token: token,
				event: event,
				data: data
			}
		});
	});
};

var findMatchingDocuments = function(token, uuid){
	var self = this;

	var idsThatNeedUpdate = [];
	var deferred = q.defer();
	var findBatch = function(limit, offset){
		return self.es.search({
			index: self.config.index,
			type: self.config.type,
			body: {
				query: {
					filtered: {
						filter: {
							and: [
								{ query: { match: { token: token } } },
								{ query: { match: { $uuid: uuid } } }
							]
						}
					}
				},
				size: limit,
				from: offset
			}
		})
		.then(function(results){
			if(results && results.hits && results.hits.total){
				var ids = _.map(results.hits.hits, function(hit){
					return hit._id;
				});

				idsThatNeedUpdate.push.apply(idsThatNeedUpdate, ids);

				if(ids.length == limit){
					findBatch(limit, offset + limit);
				} else {
					deferred.resolve(idsThatNeedUpdate);
				}

			} else {
				return deferred.resolve(idsThatNeedUpdate);
			}
		});
	};
	
	findBatch(250, 0);
	return deferred.promise;
};


ESStore.prototype.identify = function(token, uuid, userId){
	var self = this;

	token = self.formatAttribute(token);
	uuid = self.formatAttribute(uuid);
	userId = self.formatAttribute(userId);

	return self.ready.then(function(){

		var updateQueue = [];
		return findMatchingDocuments.call(self, token, uuid)
		.then(function(matches){
			if(!matches.length){
				return q.resolve();
			}

			var updates = [];
			_.each(matches, function(id){
				updates.push({ update: { _index: self.config.index, _type: self.config.type, _id: id } });
				updates.push({ doc: { data: { $userId: userId }}});
			});
			
			return self.es.bulk({
				body: updates
			});
		});
	});
};

exports.ESStore = ESStore;
exports.create = function(config){
	return new ESStore(config);
};

