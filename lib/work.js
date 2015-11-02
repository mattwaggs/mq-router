var connection = require('./mq-connection-store').conn;

var Request = require('./request');
var Response = require('./response');

var work = {

	send: function(qName, message) {

		connection.createChannel().then(function(ch) {

            // send the message.
            var data = JSON.stringify(message);
			ch.assertQueue(qName, {durable: true});
    		ch.sendToQueue(qName, new Buffer(data), {persistent: true});
	    });

	},

	receive: function(qName) {
		var qName = arguments[0];
		var args = arguments;

		connection.createChannel().then(function(ch) {

			//create an anonymous queue to bind to the exchange.
			ch.assertQueue(qName, {durable: true}).then(function(q) {
				
				ch.prefetch(1);

				//receieve msg
				ch.consume(q.queue, function(msg) {
					
					var request = new Request();
					var response = new Response();

					request.createFrom(msg);
					response.createFrom(route, msg, request);

					// we dont need to send responses with work queue but we
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

					next(1)(); // start at 1 to skip the first argument (routeName)


		      	}, {noAck: false});

			});

		});
	}

}


module.exports = work;