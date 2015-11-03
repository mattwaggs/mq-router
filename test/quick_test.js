
var expect = require('chai').expect;
var mq = require('../lib');

console.warn('[Warning] Test will fail if RabbitMQ server is not running on this machine');
console.warn('[Info]    Test will not delete queues or exchanges after tests are done.');
console.warn('[Info]    any exchange or queue created by this test will be marked as test_*');

// you may need to change this string to the connection string for the rabbit mq server.
var connectionString = 'amqp://localhost';


var itemToSend = {
	"body": {
		"number": 1
	}
};
var itemToReceive = { 
	headers: { 'x-powered-by': 'mq-router' },
	body: { number: 1 },
	query: {},
	params: {},
	errors: {}
};


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

		it('should receive itemToSend on rpc.receive', function() {

			mq.rpc.receive('test_testRPC', function(req, res) {
				var msg = JSON.stringify(req);
				res.send(msg);
			});

		});

		it('should receive the itemToReceive on rpc.send', function(done) {
			// send item A
			mq.rpc.send('test_testRPC', itemToSend, function(reply) {
				expect(JSON.parse(reply).content).to.equal(JSON.stringify(itemToReceive));
				done();
			});
		});	
		
	});
	
	describe('Checking if mq-router can send and receive messages on pub/sub.', function() {

		it('should receive itemToReceive on pubsub.receive', function(done) {
			
			mq.pubsub.receive('test_pubsub', 'xyz', 'direct', function(req, res, next) {
				var msg = JSON.stringify(req);
				expect(msg).to.equal(JSON.stringify(itemToReceive));
				done();
			});

			setTimeout(function() { // need to wait. receiver takes a moment to get set up properly. otherwise message is sent to soon.
				mq.pubsub.send('test_pubsub', 'xyz', 'direct', itemToSend);
			}, 50);
			
		});

	
	});

	describe('Checking if mq-router can send and receive messages on work.', function() {

		it('should receive itemToReceive on work.receive', function(done) {
			//this.timeout(10000);
			
			mq.work.send('test_work', itemToSend);
			
			setTimeout(function() { // to ensure that the work queue is durable.
				mq.work.receive('test_work', function(req, res, next) {
					var msg = JSON.stringify(req);
					expect(msg).to.equal(JSON.stringify(itemToReceive));
					done();
				});
			}, 50);
			
		});

	});


	
	describe('Checking if mq-router receive() can handle middleware style callbacks', function() {

		it('should increment value from 1 to 3 using middleware', function(done) {
			 
			var step1 = function(req, res, next) {
				req.body.number += 1;
				next();
			}
			var step2 = function(req, res, next) {
				req.body.number += 1;
				next();
			}
			mq.rpc.receive('test_middleware', step1, step2, function(req, res, next) {
				expect(req.body.number).to.equal(3);
				done();
			});
			setTimeout(function() { // to ensure that the rpc queue is available.
				mq.rpc.send('test_middleware', itemToSend, function(reply) {
					// dont worry about reply. just testing the middleware
				});
			}, 50);
			
		});

	});
 

}
