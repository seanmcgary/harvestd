/*
	Config proxy that routes to the correct config based on execution
*/
var _ = require('lodash');
var logwrangler = require('logwrangler');
var logger = logwrangler.create({
	level: logwrangler.levels.DEBUG
});
var path = require('path');

var requireLib = function(lib){
	return require(path.resolve(__dirname + '/../lib/' + lib));
};

module.exports = (function(){
	var config = {};
	if(process.argv[1].match(/harvestd$/i) || process.argv[1].match(/services\/harvestd/i) || process.argv[1].match(/harvestdStandalone(\.js)?$/)){
		config = require('../harvestd/config');
	} else {
		logger.log({
			level: logger.levels.WARN,
			ns: 'config-proxy',
			message: 'no config found'
		});
	}

	return _.extend(config, {
		requireLib: requireLib
	});
})();