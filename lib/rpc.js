var connection = require('./mq-connection-store').conn;
var UUID = require('./GenerateUUID');
var Request = require('./request');
var Response = require('./response');


var rpc = {

	receive: function(route) {
		var route = arguments[0];
		var args = arguments;

		connection.createChannel().then(function(ch) {

			ch.assertQueue(route, {durable: true}).then(function(q) {
				
				ch.consume(q.queue, function(msg) {

					var request = new Request();
					var response = new Response();

					request.createFrom(msg);
					response.createFrom(route, msg, request);

					response.bindResponseChannel(ch);

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

		      	});

			});
		});

	},

	send: function(route, message, callback) {

		connection.createChannel().then(function(ch) {

	        // create private callback queue
	        ch.assertQueue('', {exclusive: true}).then(function(q) {

	            var corr = UUID.generate();
	            // receive the reply
	            ch.consume(q.queue, function(msg) {
	                // ensure msg has the right correlation id
	                if (msg.properties.correlationId == corr) {
	                    callback(msg.content.toString());
	                }else{
	                    console.log('bad msg received...');
	                }
	            }, {noAck: true}); // dont need to acknowledge receiving response.

	            // send the message.
	            ch.sendToQueue(route, new Buffer(JSON.stringify(message)), { correlationId: corr, replyTo: q.queue, persistent: true} );

	        });

	    });

	}	

}





module.exports = rpc;

