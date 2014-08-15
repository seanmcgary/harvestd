var Store = require('../store');
var q = require('q');
var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var logwrangler = require('logwrangler');
var logger = logwrangler.create();
var config = require('../../../config');
var moment = require('moment-timezone');
var util = require('util');

var errorTypes = config.requireLib('/modules/errorTypes').types;
var ApiError = config.requireLib('/modules/errorTypes').ApiError;

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

var parseAggregations = function(results){
	if(results && results.aggregations){
		return results.aggregations;
	}
	return {};
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

ESStore.prototype.listEvents = function(){
	var self = this;

	return self.ready.then(function(){
		return self.es.search({
			index: self.config.index,
			type: self.config.type,
			body: {
				query: { match_all: {} },
				aggs: {
					events: {
						terms: {
							field: "event",
							size: 0 		// Integer.MAX_VALUE
						}
					}
				}
			}
		})
		.then(function(results){
			results = parseAggregations(results);
			var events = _.map(results.events.buckets, function(b){
				return b.key;
			});
			return events || [];
		});
	});
};

var validPeriods = ['minute', 'day', 'hour', 'week', 'month'];
var defaultPeriod = 'day';

var validateArguments = function(events, from, until, tzOffset, period){
	tzOffset = tzOffset || 'America/Los_Angeles';
	console.log(events);
	if(events && _.isString(events) && events.length){
		events = events.replace(', ', ',').split(',');
	}

	var now = new Date();

	if(!period || _.indexOf(validPeriods, period) < 0){
		period = defaultPeriod;
	}

	if(!from || from == 'Invalid Date'){
		from = new Date(new Date().setUTCDate(now.getUTCDate() - 30));
	}

	if(!until || until == 'Invalid Date'){
		until = new Date(now.getTime());
	}

	var tz = moment(new Date()).tz(tzOffset);
	var gmtOffset = (tz.zone() / 60) * -1;

	return q.all([events, from, until, tzOffset, period, gmtOffset]);
};

var buildRange = function(from, until){
	var range = {
		$ts: {
			gte: from.getTime(),
			lte: until.getTime()
		}
	};
	return range;
};

ESStore.prototype.getTrends = function(events, from, until, tzOffset, period){
	var self = this;
	console.log("TRENDS");
	return validateArguments(events, from, until, tzOffset, period)
	.spread(function(events, from, until, tzOffset, period, gmtOffset){

		var eventPromise;
		if(events && events.length){
			eventPromise = q.resolve(events);
		} else {
			eventPromise = self.listEvents()
			.then(function(events){
				events = _.sortBy(events, function(evt){ return evt; });

				return events.slice(0, 20);
			});
		}

		return eventPromise
		.then(function(events){

			var range = buildRange(from, until);

			var terms = _.map(events, function(evt){
				return {
					term: { event: evt }
				}
			});

			var query = {
				query: {
					filtered: {
						filter: {
							and: [
								{
									range: range
								}, {
									or: terms
								}
							]
						}
					}
				},
				aggs: {
					trends: {
						date_histogram: {
							field: '$tsDate',
							min_doc_count: 0,
							interval: period,
							time_zone: gmtOffset,
							extended_bounds: {
								min: from.getTime(),
								max: until.getTime()
							}
						},
						aggs: {
							events: {
								terms: {
									field: 'event'
								}
							}
						}
					}
				}
			};

			//console.log(JSON.stringify(query, null, '\t'));

			
			return self.ready.then(function(){
				return self.es.search({
					index: self.config.index,
					type: self.config.type,
					body: query
				})
				.then(function(results){

					results = parseAggregations(results);
					
					if(!results || !results.trends.buckets){
						return q.reject(new ApiError(errorTypes.DB_ERROR, 'error parsing es results'));
					}
					results = results.trends.buckets;


					results = _.map(results, function(bucket){
						var bukkit = {
							dateString: bucket.key_as_string,
							timestamp: bucket.key,
							events: {}
						};

						var bucketEvents = bucket.events.buckets || [];
						_.each(events, function(evt){
							var bev = _.find(bucketEvents, function(b){ return b.key == evt; });
							bukkit.events[evt] = bev ? bev.doc_count : 0;
						});

						return bukkit;
					});
					return results;
				})
				.then(function(results){
					return {
						from: from,
						until: until,
						period: period,
						tzOffset: tzOffset,
						gmtOffset: gmtOffset,
						events: events,
						data:results
					}
				});
			});
		});	
	});
};

ESStore.prototype.segmentEvent = function(event, from, until, tzOffset, period, field, segmentBy, overTime){
	var self = this;
	
	if(segmentBy.length && !segmentBy.match(/^data\./)){
		segmentBy = ['data.', segmentBy].join('');
	}

	overTime = (overTime || '').toLowerCase() == 'true' ? true : false;

	return validateArguments(event, from, until, tzOffset, period)
	.spread(function(event, from, until, tzOffset, period, gmtOffset){
		event = event[0];

		var range = buildRange(from, until);

		var calculate = {
			calculate: {
				stats: {
					field: field
				}
			}
		};

		var primaryAgg = _.cloneDeep(calculate);

		if(segmentBy && segmentBy.length){

			primaryAgg.segmented = {
				terms: {
					field: segmentBy
				},
				aggs: calculate
			};
		}

		var aggregation;
		if(overTime){
			aggregation = {
				overTime: {
					date_histogram: {
						field: '$tsDate',
						min_doc_count: 0,
						interval: period,
						time_zone: gmtOffset,
						extended_bounds: {
							min: from.getTime(),
							max: until.getTime()
						}
					},
					aggs: primaryAgg
				}
			};
		} else {
			aggregation = primaryAgg;
		}

		if(segmentBy){
			aggregation.segments = {
				terms: {
					field: segmentBy
				}
			};
		}
		

		var query = {
			query: {
				filtered: {
					filter: {
						and: [
							{
								range: range
							}, {
								term: { event: event }
							}
						]
					}
				}
			},
			aggs: aggregation
		};
		
		return self.ready.then(function(){
			return self.es.search({
				index: self.config.index,
				type: self.config.type,
				body: query
			})
			.then(function(results){
				results = parseAggregations(results);
				return results;

				var parseData = function(results){
					var returnData = {
						all: {
							segmentBy: 'none',
							values: {
								fieldValue: '',
								numberOfFields: results.calculate.count,
								values: _.mapValues(results.calculate, function(val){
									return val || 0;
								})
							}
						}
					};

					if(results.segmented && results.segmented.buckets && results.segmented.buckets.length){
						returnData.segmented = {
							segmentBy: segmentBy,
							values: _.map(results.segmented.buckets, function(b){
								var bukkit = {
									fieldValue: b.key,
									numberOfFields: b.doc_count,
									values: b.calculate
								};
								return bukkit;
							})
						};
					} else if(segmentBy){
						returnData.segmented = {
							segmentBy: segmentBy,
							values: []
						}
					}
					return returnData;
				};

				if(segmentBy ){

				}
				
				if(overTime){
					if(results.overTime && results.overTime.buckets && results.overTime.buckets.length){
						results = results.overTime.buckets;

						results = _.map(results, function(res){
							var parsed = parseData(res);

							return {
								dateString: res.key_as_string,
								timestamp: res.key,
								data: parsed
							};
						});

						return results;
					} else {
						return [];
					}
				} else {
					return parseData(results);
				}
				
				return results;
			})
			.then(function(results){
				return {
					from: from,
					until: until,
					period: period,
					tzOffset: tzOffset,
					gmtOffset: gmtOffset,
					event: event,
					field: field,
					data:results
				}
			});
		});

	});
};

var createAndStatement = function(andParams){
	var ands = [];

	_.each(andParams, function(param){
		if(param.operation == 'equals'){
			var term = {};
			term[param.property] = param.value;
			ands.push({
				query: {
					match: term
				}
			});
		}
	});
	return ands;
};

var createOrStatement = function(orParams){
	var ors = [];

	_.each(orParams, function(param){
		if(param.operation == 'equals'){
			var term = {};
			term[param.property] = param.value;
			ors.push({
				query: {
					match: term
				}
			});
		}
	});
	return ors;
};

var buildFilterQuery = function(data){
	var query = {};

	if(data.and && _.isArray(data.and) && data.and.length){
		query.and = createAndStatement(data.and);
	}

	if(data.or && _.isArray(data.or) && data.or.length){
		query.or = createOrStatement(data.or);
	}

	return query;
};

var buildSegmentation = function(dimensions){
	var segmentation = {};

	var segments = [];

	_.each(dimensions, function(dim, index){
		var seg = {
			terms: {
				field: dim.property
			}
		};
		segments.push(seg);
	});

	var insert = function(seg, tree){
		if(tree.aggs){
			insert(seg, tree.aggs.dimension);
		} else {
			tree.aggs = {
				dimension: seg
			};
		}
	};

	_.each(segments, function(seg, index){
		if(index == 0){
			segmentation.aggs = {
				dimension: seg
			};
		} else {
			insert(seg, segmentation.aggs.dimension);
		}
	});

	return segmentation;
};


/*
	{
		event: 'some event name',
		where: {
			and: [
				{
					property: "something",
					operation: 'equals',
					value: 'blah'
				}
			],
			or: []
		},
		dimensions: [
			{
				property: "something"
			}
		]
	}

*/
ESStore.prototype.segmentation = function(data){
	console.log(data);
	var self = this;

	var filter = null;

	if(!data.where){
		data.where = {};
	}

	if(!data.where.and){
		data.where.and = [];
	}

	data.where.and.unshift({
		property: 'event',
		operation: 'equals',
		value: data.event
	});

	if(data.where && _.keys(data.where).length){
		filter = buildFilterQuery(data.where);
	}

	var segmentation = null;
	if(data.dimensions && _.isArray(data.dimensions) && data.dimensions.length){
		segmentation = buildSegmentation(data.dimensions);
	}

	var fullQuery = {
		query: {
			filtered: {
				filter: filter
			}
		}
	};

	if(segmentation){
		fullQuery.aggs = segmentation.aggs;
	}

	return self.ready.then(function(){
		return self.es.search({
			index: self.config.index,
			type: self.config.type,
			body: fullQuery
		})
		.then(function(results){
			results = parseAggregations(results);
			//return results;

			var parseTree = function(buckets, index){
				var bukkits = [];
				_.each(buckets, function(buk, i){
					var data = {
						value: buk.key,
						count: buk.doc_count
					};

					if(buk.dimension && buk.dimension.buckets){
						data.dimensions = parseTree(buk.dimension.buckets, index + 1);
					}
					
					bukkits.push(data);
				});
				var b = {};
				b[data.dimensions[index].property] = bukkits;
				return b;
			};

			results = parseTree(results.dimension.buckets, 0);

			return {
				dimensions: results
			}
		});
	});
};


exports.ESStore = ESStore;
exports.create = function(config){
	return new ESStore(config);
};

