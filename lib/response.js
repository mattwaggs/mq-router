
var Response = function() {

	var self = this;

	this.headers = {
		'x-powered-by': 'mq-router'
	};

	this.channel = function() { 
		throw 'Channel not bound';
	}

	this.statusCode = 200; // default okay code.
	this.errors 	= {};  // default no errors.
	this.success 	= true;// success of operation
	this.sent 		= false;
	this.enabled 	= true; 

	this.status  = function(code) {
		self.statusCode = code;
		return self;
	}

	// create a common response object from the incoming mq message.
	this.createFrom = function(routeName, objMsg, request) {

		self.headers.routeName 		= routeName || '<unknown>';
		self.headers.replyTo 		= objMsg.properties.replyTo;
		self.headers.correlationId 	= objMsg.properties.correlationId;

		addProperties(self.headers, objMsg.properties.headers);
		addProperties(self.errors, request.errors);

	}


	this.bindResponseChannel = function(ch) {
		self.channel = ch;
	}

	this.disable = function() {
		self.enabled = false;
		return self;
	}

	this.send = function(reply) {
		
		if(self.sent) {
			throw 'Response was already sent.';
		}else if(!self.enabled) {
			throw 'Cannot send response on work queue.';
		}else{
			var fullResponse = {
				'statusCode': self.statusCode,
				'success': self.success,
				'errors': self.errors,
				'content': reply
			}

			self.channel.sendToQueue(self.headers.replyTo, 
		        new Buffer(JSON.stringify(fullResponse)), {correlationId: self.headers.correlationId}
		    );

		    self.sent = true;
		}
	}

}


function addProperties(objA, objB) {
	for(item in objB) {
		objA[item] = objB[item];
	}
	return objA;
}

module.exports = Response;

