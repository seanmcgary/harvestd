var _ = require('lodash');
var path = require('path');

var env = process.NODE_ENV || 'development';

var requireConfig = function(conf){
	return require('./' + conf + '.js')(env);
};

var packageVersion = require(path.normalize(__dirname + '/../../../package.json')).version;

var config = {
	server: requireConfig('server'),
	elasticsearch: requireConfig('elasticsearch'),
	packageVersion: packageVersion
};

module.exports = config;