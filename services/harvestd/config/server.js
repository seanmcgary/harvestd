var _ = require('lodash');

var base = {
	port: 9000
};

var envs = {
	development: _.extend(_.cloneDeep(base), {}),
	production: _.extend(_.cloneDeep(base), {})
};

var envMap = {
	'HARVESTD_SERVER_PORT': 'port'
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