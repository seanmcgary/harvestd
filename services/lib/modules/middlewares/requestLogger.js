var _ = require('lodash');
var logwrangler = require('logwrangler');

var requestLogger = function(options){
	options = options || {};
	
	var logger = options.logger || logwrangler.create({});


	return function(req, res, next){
		var startTime = Date.now();

		var oldEnd = res.end;

		res.end = function(){
			console.log(arguments);
			var delta = Date.now() - startTime;

			oldEnd.apply(res, _.values(arguments));
		};
	};
};
module.exports = requestLogger;