var connection = require('./mq-connection-store').conn;

var pubsub = {

	send: function(exchange, route, type, message) {
		exchange = exchange+'.'+type;
		connection.createChannel().then(function(ch) {

	            // send the message.
				ch.assertExchange(exchange, type);
	            ch.publish(exchange, route, new Buffer(JSON.stringify(message)));

	    });

	},

	receive: function(exchange, route, type, callback) {
		exchange = exchange+'.'+type;
		connection.createChannel().then(function(ch) {

			//create the exchange
			ch.assertExchange(exchange, type);

			//create an anonymous queue to bind to the exchange.
			ch.assertQueue('', {exclusive: true}).then(function(q) {
				ch.bindQueue(q.queue, exchange, route);


				//receieve msg
				ch.consume(q.queue, function(msg) {

					var request = {};

					request.headers = msg.properties.headers;
					request.headers = msg.properties.headers;
					request.content = JSON.parse(msg.content.toString());
					// do something when the message is receieved
		        	callback(request);

		      	}, {noAck: true});

			});

		});
	}

}


module.exports = pubsub;