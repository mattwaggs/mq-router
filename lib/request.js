
var Request = function() {

	this.headers = {
		'x-powered-by': 'mq-router'
	};
	this.body 	= {}; // post params;
	this.query 	= {}; // get params;
	this.params = {}; // embeded url params

	this.errors = {};

	// create a common request object from the incoming mq message.
	this.createFrom = function(objMsg) {

		var msgContent = {};

		try{
			// try to parse the request.
			msgContent = JSON.parse(objMsg.content.toString());

		}catch(e) { /* Error parsing content. */ msgContent.errors['General Request Error'] = e; }

		msgContent.body 	= msgContent.body 	|| {};
		msgContent.query 	= msgContent.query 	|| {};
		msgContent.params 	= msgContent.params || {};
		msgContent.errors 	= msgContent.errors || {};
		
		addProperties(this.headers, objMsg.properties.headers);
		addProperties(this.body, msgContent.body);
		addProperties(this.query, msgContent.query);
		addProperties(this.params, msgContent.params);
		addProperties(this.errors, msgContent.errors);
		
	}

}




function addProperties(objA, objB) {
	for(item in objB) {
		objA[item] = objB[item];
	}
	return objA;
}

module.exports = Request;

