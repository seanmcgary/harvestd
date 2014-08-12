/**
	Store interface
*/

var q = require('q');
var _ = require('lodash');
var logwrangler = require('logwrangler');
var logger = logwrangler.create({
	level: logwrangler.levels.DEBUG
});

function Store(){ };

Store.prototype.track = function(token, event, data){
	return q.resolve();
};

Store.prototype.identify = function(token, uuid, userId){
	return q.resolve();
};

Store.prototype.profile = function(token, id, data){
	return q.resolve();
};

Store.prototype.formatAttribute = function(attribute){
	if(_.isString(attribute) && attribute.length){
		var attr = attribute.toLowerCase();

		if(_.indexOf(['true', 'false'], attr) >= 0){
			return attr == 'true' ? true : false;
		}

		var matches = attr.match(/^[0-9]+/ig);
		
		// is a number
		if(matches && matches.length == 1){
			var num = parseInt(attr);

			if(!_.isNaN(num) && _.isNumber(num)){
				return num;
			}
		}

		// guess its just a normal string
		return attribute;
	} else if(_.isArray(attribute) || _.isObject(attribute)){
		_.each(attribute, function(val, index){
			attribute[index] = Store.prototype.formatAttribute(val);
		});
		return attribute;
	}
	return attribute;
};

/**
	Return a list of event names

	[
		'some-event',
		'Hold my beer',
		'Watch this'
	]
*/
Store.prototype.listEvents = function(){
	logger.log({
		level: logger.levels.WARN,
		ns: 'Store',
		message: 'listEvents - requires implementation'
	});
	return q.resolve([]);
};

/**
	{
		from: "2014-08-12T00:00:00.000Z",
		until: "2014-08-12T22:43:54.402Z",
		period: "hour",
		tzOffset: "America/Los_Angeles",
		gmtOffset: -7,
		data: [
			{
				dateString: "2014-08-12T00:00:00.000Z",
				timestamp: 1407801600000,
				events: {
					test-event: 0
				}
			}
		]
	}
*/
Store.prototype.getTrends = function(events, from, until, tzOffset, period){
	logger.log({
		level: logger.levels.WARN,
		ns: 'Store',
		message: 'getTrends - requires implementation'
	});
	return q.resolve({
		from: from,
		until: until,
		tzOffset: tzOffset,
		period: period,
		data: []
	});
};

Store.prototype.calculateEvent = function(event, from, until, tzOffset, period){
	logger.log({
		level: logger.levels.WARN,
		ns: 'Store',
		message: 'calculateEvent - requires implementation'
	});
	return q.resolve({
		from: from,
		until: until,
		tzOffset: tzOffset,
		period: period,
		data: []
	});
};


module.exports = Store;