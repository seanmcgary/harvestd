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
	var config = require('../harvestd/config');

	return _.extend(config, {
		requireLib: requireLib
	});
})();