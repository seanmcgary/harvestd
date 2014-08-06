/**
	Store interface
*/

var q = require('q');
var _ = require('lodash');


function Store(){

};


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

		var matches = attr.match(/[0-9]+/ig);
		
		// is a number
		if(matches && matches.length == 1){
			return parseInt(attr);
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


module.exports = Store;