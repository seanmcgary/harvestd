var Store = require('../store');
var q = require('q');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var logwrangler = require('logwrangler');
var logger = logwrangler.create();

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
		console.log(event);
		console.log(token);
		console.log(data);

		return self.es.create({
			index: self.config.index,
			type: self.config.type,
			refresh: true,
			body: {
				token: token,
				event: event,
				data: data
			}
		})
		.then(function(result){
			logger.log({
				level: logger.levels.INFO,
				ns: 'ESStore',
				message: 'track',
				data: {
					event: event,
					token: token,
					data: data,
					result: result
				}
			});
		}, function(err){
			logger.log({
				level: logger.levels.ERROR,
				ns: 'ESStore',
				message: 'track failed',
				data: {
					event: event,
					token: token,
					data: data,
					error: err
				}
			});
		})
	});
};

/*
	Only entries that have the same UUID and userId should be updated.

	If they dont have the same UUID and userId, that means it has been otherwise
	identified by someone already. We only want to update documents that have NOT
	been identified
*/
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
								{ query: { match: { $uuid: uuid } } },
								{ query: { match: { $userId: uuid } } }
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
		logger.log({
			level: logger.levels.INFO,
			ns: 'ESStore',
			message: 'identify',
			data: {
				token: token,
				uuid: uuid,
				userId: userId
			}
		});
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


ESStore.prototype.profile = function(token, id, data){
	var self = this;

	token = self.formatAttribute(token);
	id = self.formatAttribute(id);
	data = self.formatAttribute(data);
};

ESStore.prototype.getProfile = function(token, id){

};

exports.ESStore = ESStore;
exports.create = function(config){
	return new ESStore(config);
};

