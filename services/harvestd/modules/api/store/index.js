/**
	Store interface
*/

var q = require('q');



function Store(){

};


Store.prototype.track = function(token, event, data){
	return q.resolve();
};

Store.prototype.identify = function(token, from, to){
	return q.resolve();
};

module.exports = Store;