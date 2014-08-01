var _ = require('lodash');
var q = require('q');
var config = require('../../../config');

var errorTypes = config.requireLib('/modules/errorTypes').types;
var ApiError = config.requireLib('/modules/errorTypes').ApiError;

module.exports = function(server, config, Store){

	var validateTrackFields = function(req, res, next){
		var errors = false;
		var errorData = {};

		var data = req.body || {};

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
			return res.handleError(new ApiError(errorTypes.MISSING_FIELDS, errorData));
		}

		next();
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
	server.post('/track', validateTrackFields, function(req, res){

		Store.track(req.body.token, req.body.event, req.body.data)
		.then(function(result){
			res.json(result);
		}, res.handleError);
	});

	var validateIdentifyFields = function(req, res, next){
		var errors = false;
		var errorData = {};

		var data = req.body || {};

		if(!data.token || !data.token.length){
			errors = true;
			errorData.token = 'Please provide your API token';
		}

		if(!data.fromId || !data.fromId.length){
			errors = true;
			errorData.fromId = 'Please provide a fromId';
		}

		if(!data.toId || !data.toId.length){
			errors = true;
			errorData.toId = 'Please provide a toId';
		}

		if(errors){
			return res.handleError(new ApiError(errorTypes.MISSING_FIELDS, errorData));
		}

		next();
	};

	/**
		POST /identify

		{
			token: <your account token>,			// your account token
			fromId: ''								// their previous ID
			toId: ''								// the ID that should overwrite that previous ID
		}	
	*/
	server.post('/identify', validateIdentifyFields, function(req, res){
		Store.identify(req.body.token, req.body.fromId, req.body.toId)
		.then(function(result){
			res.json(result);
		}, res.handleError);
	});

};