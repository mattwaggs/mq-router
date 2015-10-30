
var connection = require('./mq-connection-store');
var amqp = require('amqplib');
var Promise = require('bluebird');

var initialized = false;


function initialize(parent) {
	
	parent.rpc 		= require('./rpc');
	parent.pubsub 	= require('./pubsub');

	return parent;
}


module.exports = {

	init: function(param, cb) {

		var self = this;

		if(typeof cb === "function") {
			// use callback instead of promise
			amqp.connect(param).then(function(conn) {
				connection.conn = conn;
				initialized = true;
				self = initialize(self);
				cb(null, conn);
			}).catch(function(err) {
				cb(err, null);
				console.log(err);
			});
		}else{
			// use promise
			return new Promise(function(resolve, reject) {
				amqp.connect(param).then(function(conn) {
					connection.conn = conn;
					initialized = true;
					self = initialize(self);
					return resolve(conn);
				}).catch(function(err) {
					return reject(err);
					console.log(err);
				});
			});
		
		}

	},

	


}
