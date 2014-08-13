var _ = require('lodash');
var q = require('q');
var async = require('async');

module.exports = function(server, config, Store){
	var errorTypes = config.requireLib('/modules/errorTypes').types;
	var ApiError = config.requireLib('/modules/errorTypes').ApiError;

	server.get('/analytics/trends', function(req, res, next){
		var period = req.query.period;
		var from = new Date(req.query.from);
		var until = new Date(req.query.until);
		var tzOffset = req.query.tzOffset;
		var events = req.query.events;
		
		Store.getTrends(events, from, until, tzOffset, period)
		.then(function(data){
			res.json(data);
		}, res.handleError);
	});

	server.get('/analytics/events', function(req, res, next){
		Store.listEvents()
		.then(function(events){
			res.json(events);
		}, res.handleError);
	});

	server.get('/analytics/segment', function(req, res, next){
		var period = req.query.period;
		var from = new Date(req.query.from);
		var until = new Date(req.query.until);
		var tzOffset = req.query.tzOffset;
		var event = req.query.event;
		var field = req.query.field;
		var segmentBy = req.query.segmentBy;
		var overTime = req.query.overTime;

		Store.segmentEvent(event, from, until, tzOffset, period, field, segmentBy, overTime)
		.then(function(data){
			res.json(data);
		}, res.handleError);
	});
};