var _ = require('lodash');

var base = {
	host: 'elasticsearch.local',
	port: 9200,
	apiVersion: '1.1',
	index: 'analytics',
	type: 'event'
};

exports.base = _.cloneDeep(base);
exports.development = _.extend(_.cloneDeep(base), {});
exports.production = _.extend(_.cloneDeep(base), {
    host: '',
	port: 80,
	apiVersion: '1.1'
});