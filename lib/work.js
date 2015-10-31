var connection = require('./mq-connection-store').conn;

var work = {

	send: function(qName, message) {

		connection.createChannel().then(function(ch) {

            // send the message.
            var data = JSON.stringify(message);
			ch.assertQueue(qName, {durable: true});
    		ch.sendToQueue(qName, new Buffer(data), {persistent: true});
	    });

	},

	receive: function(qName, callback) {

		connection.createChannel().then(function(ch) {

			//create an anonymous queue to bind to the exchange.
			ch.assertQueue(qName, {durable: true}).then(function(q) {
				
				ch.prefetch(1);

				//receieve msg
				ch.consume(q.queue, function(msg) {
					
					var request = {};

					request.headers = msg.properties.headers;
					request.headers = msg.properties.headers;
					request.content = JSON.parse(msg.content.toString());
					// do something when the message is receieved
		        	callback(request);

		        	ch.ack(msg);

		      	}, {noAck: false});

			});

		});
	}

}


module.exports = work;