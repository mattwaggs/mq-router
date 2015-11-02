var connection = require('./mq-connection-store').conn;

var Request = require('./request');
var Response = require('./response');

var pubsub = {

	send: function(exchange, route, type, message) {
		exchange = exchange+'.'+type;
		connection.createChannel().then(function(ch) {

	            // send the message.
				ch.assertExchange(exchange, type);
	            ch.publish(exchange, route, new Buffer(JSON.stringify(message)));

	    });

	},

	receive: function(exchange, route, type) {

		var exchange = arguments[0];
		var route 	 = arguments[1];
		var type 	 = arguments[2];
		var args 	 = arguments;

		exchange = exchange+'.'+type;
		connection.createChannel().then(function(ch) {

			//create the exchange
			ch.assertExchange(exchange, type);

			//create an anonymous queue to bind to the exchange.
			ch.assertQueue('', {exclusive: true}).then(function(q) {
				ch.bindQueue(q.queue, exchange, route);


				//receieve msg
				ch.consume(q.queue, function(msg) {

					var request = new Request();
					var response = new Response();

					request.createFrom(msg);
					response.createFrom(route, msg, request);

					// we dont need to send responses with pubsub but we
					// keep the object so the paramaters match the method signature of the middleware and final handlers. 
					response.disable(); 

					ch.ack(msg);

					// process callbacks
					var next = function(csIdx) {
						return function() {
							if(csIdx+1 < args.length) {
								args[csIdx](request, response, next(csIdx+1))
							}else{
								args[csIdx](request, response, function() {})
							}

						}

					};

					next(3)(); // start at 1 to skip the first argument (routeName)


		      	}, {noAck: true});

			});

		});
	}

}


module.exports = pubsub;