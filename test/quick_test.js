
var expect = require('chai').expect;
var mq = require('../lib');

console.warn('[Warning] Test will fail if RabbitMQ server is not running on this machine');

// you may need to change this string to the connection string for the rabbit mq server.
var connectionString = 'amqp://localhost';

var itemA = {"greetings": "hello world!"};
var itemB = {"joke": "Chuck Norris counted to infinity - twice."}



describe('Checking if mq-router can connect', function() {

	it('should connect with given connectionString: ' + connectionString, function(done) {

		mq.init(connectionString).then(function() {
			done();
			afterConnect();
		}, function(err) {
			console.log('[ERROR] Failed to connect.');
		});

	});

});


function afterConnect() {
	describe('Checking if mq-router can send and receive messages on rpc.', function() {


		it('should receive item A on rpc.receive', function() {

			mq.rpc.receive('myTestRoute', function(req, res) {
				var msg = req.content;
				res.send(msg);
			});

		});

		it('should receive the same item it sent on rpc.send', function(done) {
			// send item A
			mq.rpc.send('myTestRoute', itemA, function(reply) {
				expect(reply).to.equal(JSON.stringify(itemA));
				done();
			});
		});	
		

	});
 

	describe('Checking if mq-router can send and receive messages on pub/sub.', function() {

		it('should receive item B on pubsub.receive', function(done) {
			
			mq.pubsub.receive('x', 'xyz', 'direct', function(req) {
				var msg = JSON.stringify(req.content);
				expect(msg).to.equal(JSON.stringify(itemB));
				done();
			});

			setTimeout(function() { // need to wait. receiver takes a moment to get set up properly. otherwise message is sent to soon.
				mq.pubsub.send('x', 'xyz', 'direct', itemB);
			}, 50);
			
		});

	
	});




	describe('Checking if mq-router can send and receive messages on work.', function() {

		it('should receive item B on work.receive', function(done) {
			
			mq.work.send('workTest', itemB);

			setTimeout(function() { // to ensure that the work queue is durable.
				mq.work.receive('workTest', function(req) {
					var msg = JSON.stringify(req.content);
					expect(msg).to.equal(JSON.stringify(itemB));
					done();
				})
			}, 50);
			
		});

	
	});
 

}
