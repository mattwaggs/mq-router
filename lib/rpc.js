var connection = require('./mq-connection-store').conn;

var UUID = require('./GenerateUUID');

var rpc = {

	receive: function(route, callback) {

		connection.createChannel().then(function(ch) {

			ch.assertQueue(route, {durable: true}).then(function(q) {
				
				ch.consume(q.queue, function(msg) {

					msg.content = JSON.parse(msg.content.toString());
			
					var request = {};
					var response = {};

					request.headers = msg.properties.headers;
					request.headers = msg.properties.headers;
					request.correlationId = msg.properties.correlationId;
					request.content = msg.content;

					response.replyTo = msg.properties.replyTo;
					response.send = function(reply) {
						ch.sendToQueue(response.replyTo, 
			                new Buffer(JSON.stringify(reply)), {correlationId: msg.properties.correlationId}
			            );
					}

					ch.ack(msg);

		        	callback(request, response);

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
	            }, {noAck: true});
	            // noAck means im not gonna acknoledge the reply.  

	            // send the message.
	            ch.sendToQueue(route, new Buffer(JSON.stringify(message)), { correlationId: corr, replyTo: q.queue, persistent: true} );

	        });

	    });

	}	

}





module.exports = rpc;

