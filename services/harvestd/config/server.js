var _ = require('lodash');

var base = {
	port: 9000,
	cookieDomain: 'localhost',
	cookieSecure: false,
	cookieMaxAge: 60 * 60 * 24 * 365,
	cookieHttpOnly: true,
	cookiePath: '/',
	allowCORS: true
};

var envs = {
	development: _.extend(_.cloneDeep(base), {}),
	production: _.extend(_.cloneDeep(base), {})
};

var envMap = {
	'HARVESTD_SERVER_PORT': 'port',
	'HARVESTD_SERVER_COOKIE_DOMAIN': 'cookieDomain',
	'HARVESTD_SERVER_COOKIE_SECURE': 'cookieSecure',
	'HARVESTD_SERVER_COOKIE_MAX_AGE': 'cookieMaxAge',
	'HARVESTD_SERVER_COOKIE_HTTP_ONLY': 'cookieHttpOnly',
	'HARVESTD_SERVER_COOKIE_PATH': 'cookiePath',
	'HARVESTD_SERVER_ALLOW_CORS': 'allowCORS',
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