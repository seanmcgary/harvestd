var _ = require('lodash');

var base = {
	host: 'elasticsearch.local',
	port: 9200,
	apiVersion: '1.1',
	index: 'analytics',
	type: 'event'
};

var envs = {
	base: _.cloneDeep(base),
	development: _.extend(_.cloneDeep(base), {}),
	production: _.extend(_.cloneDeep(base), {
	    host: '',
		port: 80,
		apiVersion: '1.1'
	})
};

var envMap = {
	'HARVESTD_ELASTICSEARCH_HOST': 'HOST',
	'HARVESTD_ELASTICSEARCH_PORT': 'port',
	'HARVESTD_ELASTICSEARCH_API_VERSION': 'apiVersion',
	'HARVESTD_ELASTICSEARCH_INDEX': 'index',
	'HARVESTD_ELASTICSEARCH_TYPE': 'type'
};

module.exports = function(env){
	if(!envs[env]){
		throw new Error('missing env "' + env + '"');
	}

	config = envs[env];

	_.each(envMap, function(val, key){
		if(process.env[key] && process.env[key].length){
			config[val] = process.env[key];
		}
	});

	return envs[env];
};