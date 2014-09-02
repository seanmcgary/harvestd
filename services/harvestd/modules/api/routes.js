var _ = require('lodash');
var q = require('q');
var config = require('../../../config');
var async = require('async');

var errorTypes = config.requireLib('/modules/errorTypes').types;
var ApiError = config.requireLib('/modules/errorTypes').ApiError;


module.exports = function(server, config, Store){

	var validateTrackFields = function(data){
		var errors = false;
		var errorData = {};

		var data = data || {};

		if(!data.event || !data.event.length){
			errors = true;
			errorData.event = 'Please provide an event';
		}

		if(!data.token || !data.token.length){
			errors = true;
			errorData.token = 'Please provide your API token';
		}

		if(!data || !_.keys(data.data).length){
			errors = true;
			errorData.data = {
				$uuid: 'Please provide a uuid'
			}
		}

		if(data.data && (!data.data.$uuid || !data.data.$uuid.length)){
			errors = true;
			if(!errorData.data){
				errorData.data = {};
			}

			errorData.data.$uuid = 'Please provide a uuid';
		}

		if(errors){
			return q.reject(new ApiError(errorTypes.MISSING_FIELDS, errorData));
		}

		return q.resolve();
	};

	/**
		POST /track

		{
			token: <your account token>,			// your account token
			event: 'some event name',				// name of the event being emitted
			data: {									// an object of data values to track
				$uuid: '',							// unique identifier for user
				$userId: '', 						// id of the thing you'd wish to track. could be a user ID. could also be the same as the $uuid field if an ID is not available
				ip: '127.0.0.1',					// IP address of the user
				referrer: 'google.com', 			// where the user was referred from
				campaigns: ['email', 'facebook']	// list of campaign tags currently applicable to the user
			}
		}	
	*/
	var trackEvent = function(data){
		return validateTrackFields(data)
		.then(function(){
			return Store.track(data.token, data.event, data.data);
		});
	};

	server.post('/track', function(req, res){
		trackEvent(req.body)
		.then(function(result){
			res.json(result);
		}, res.handleError);
	});

	var validateIdentifyFields = function(data){
		var errors = false;
		var errorData = {};

		var data = data || {};

		if(!data.token || !data.token.length){
			errors = true;
			errorData.token = 'Please provide your API token';
		}

		if(!data.uuid || !data.uuid.length){
			errors = true;
			errorData.uuid = 'Please provide a uuid';
		}

		if(!data.userId || !data.userId.length){
			errors = true;
			errorData.userId = 'Please provide a userId';
		}

		if(errors){
			return q.reject(new ApiError(errorTypes.MISSING_FIELDS, errorData));
		}
		return q.resolve();
	};

	/**
		POST /identify

		{
			token: <your account token>,			// your account token
			uuid: ''								// their previous ID
			userId: ''								// the ID that should overwrite that previous ID
		}	
	*/
	var identifyUser = function(data){
		return validateIdentifyFields(data)
		.then(function(){
			return Store.identify(data.token, data.uuid, data.userId);
		});
	};

	server.post('/identify', function(req, res){
		identifyUser(req.body)
		.then(function(result){
			res.json(result);
		}, res.handleError);
	});

	server.post('/actions', function(req, res){
		var actions = req.body.actions;

		if(!actions || !_.isArray(actions) || !actions.length){
			return res.handleError(new ApiError(errorTypes.INVALID_FIELDS, {
				actions: 'Actions should be an array of actions'
			}));
		}

		// no need to wait for everything to finish
		res.json(200, {});

		var queue = [];
		var results = Array(actions.length);
		_.each(actions, function(action, index){
			queue.push((function(action, index){
				return function(cb){
					var promise;
					switch(action[0]){
						case 'track':
							promise = trackEvent(action[1]);
							break;
						case 'identify':
							promise = identifyUser(action[1]);
							break;
						case 'setUserValues':
							var a = action[1];
							promise = setUserValues(a.token, a.$uuid, a.data);
						default:
							promise = q.resolve();
							break;
					}

					promise
					.then(function(r){
						results[index] = true;
						cb(null);
					}, function(err){
						results[index] = err;
						cb(null);
					});
				};
			})(action, index));
		});
		async.series(queue, function(){

		});
	});

	server.put('/users/:uuid', function(req, res){

		setUserValues(req.body.token, req.params.uuid, req.body.data);
		res.json(200, {});
	});

	var setUserValues = function(token, uuid, data){
		Store.setUserValues(token, uuid, data)
		.then(function(result){
		
		});
	};

	server.get('/users/:uuid', function(req, res){
		return Store.getUser(req.params.uuid)
		.then(function(userDoc){
			if(!userDoc || !userDoc.length){
				return res.handleError(new ApiError(errorTypes.NOT_FOUND, {
					uuid: req.params.uuid
				}));
			}

			var user = {};

			_.each(userDoc, function(doc){
				doc = doc._source;
				user[doc.field.key] = doc;
			});
			res.json(user);
		});
	});

};