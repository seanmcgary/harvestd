var _ = require('lodash');

var base = {
	port: 9000
};

var envs = {
	development: _.extend(_.cloneDeep(base), {}),
	production: _.extend(_.cloneDeep(base), {})
};

module.exports = envs;