var _ = require('lodash');
var logwrangler = require('logwrangler');

var requestLogger = function(options){
	options = options || {};
	
	var logger = options.logger || logwrangler.create({});

	return function(req, res, next){
		var startTime = Date.now();

		var oldEnd = res.end;

		res.end = function(chunk, encoding){
			var delta = Date.now() - startTime;

			var statusCode = res.statusCode;
			var isError = _.indexOf([4,5], ~~(res.statusCode / 100)) >= 0;

			logger.log({
				level: (isError ? logger.levels.ERROR : logger.levels.INFO),
				message: [req.method, req.path].join(' '),
				data: {
					responseTime: delta,
					method: req.method,
					statusCode: statusCode
				}
			});

			oldEnd.apply(res, _.values(arguments));
		};

		next();
	};
};
module.exports = requestLogger;