var _ = require('lodash');

var env = process.NODE_ENV || 'development';

var requireConfig = function(conf){
	return require('./' + conf + '.js')(env);
};

var config = {
	server: requireConfig('server'),
	elasticsearch: requireConfig('elasticsearch')
};

module.exports = config;