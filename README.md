# mq-router
+ *Not stable. Still in development.* 

A simple way to interact with a RabbitMQ server in nodejs
<br/>
> Note: This is just a *very simple* implementation of amqplib 


<br/>
Sometimes you just need a simple way of sending messages from one service to another. MQ-Router aims to make interacting with a message queue similar to using the express router.

```javascript
var mq = require('mq-router');
// connect to RabbitMQ server
mq.init('amqp://localhost').then(function() {
  // listen for requests on a specific queue
  mq.rpc.receive('route.path',  function(req, res, next) {
    // do someting with the request.
    res.send(newData);
  });
  
  // Similar to express or connect, middleware can be also attached to these routes
  mq.rpc.receive('route.getThing', hasAuthentication, someMiddleware, function(req, res, next) {
    res.send(newData);
  });
});
```

The goal of this module is to enable certain api endpoints to be accessible by message queues in the same way they are accessible from http routes.

```javascript
// example api endpoint
api.v1.users.getUser = function(req, res, next) {
  var user = UserModel.get(req.query.userId);
  res.send(user);
}

// access api endpoint via http route
router.get('/api/v1/users?userId=123', someMiddleware, api.v1.users.getUser);
// access api endpoint via message queue
mq.rpc.receive('api.v1.users.getUser', someMiddleware, api.v1.users.getUser);
// notice the method signature is the same. 
// this makes it easy for the message queue to work similar to express routes.
```

**request**, **response** and **next** will be passed to each middleware or callback passed in, however response is really only needed for rpc as rpc is the only one capable of sending a response.

There are currently three options for sending and receiving messages.
 - rpc
 - pub/sub
 - work

Both **rpc**, **work**, and **pub/sub** have a send(), and receive() function.

###Examples of RPC:
```javascript
// Server A sends message to server B, server B responds.

// Sending a Message (Server A)
mq.rpc.send('route.path', {greetings: 'hello world'}, function(reply) {
  console.log('Server B responded with: ' + reply.msg)
});

// Receiving a Message (Server B)
mq.rpc.receive('route.path', function(req, res){
  console.log('Server A says: ' + req.content['greetings']);
  var x = {msg: 'Hello friend'}
  res.send(x);
});

```



###Examples of Pub/Sub
```javascript

// Server A needs to tell server B something, it doesnt need a response from server B.
mq.pubsub.send('someExchange', 'someQueue', 'direct', someData);

// Server B is listening (subscribed) to messages on that exchange / queue
mq.pubsub.receive('someExchange', 'someQueue', 'direct', function(req) {
  // do something with data.
  var data = req.content;
});

```

The third parameter in pubsub is the exchange type.  This can be **direct** or **fanout**. Direct will handle the messages in a round robbin way, while fanout will send the message to all receivers.  It's important to note that in pub/sub the first 3 parameters need to match on both the sending and receiving parties.


Pub/Sub does not persist messages.  Subscribers will only receive messages sent during its lifetime. If a message is sent before the subscriber is alive, the subscriber will never receive the message.
with pub/sub it is possible that no one will receive the message if no one is listening. 


###Examples of Work queue
```javascript

// Server A needs to tell server B to do something when it gets a chance.
mq.work.send('someWorkQueue', someMessage);

// Server B will fetch any messages it has and get to work.
mq.work.receive('someWorkQueue', function(req) {
  var data = req.content;
  // do something with data
});

```


If server B is not active when the message is sent, it will still receive the message when it comes online.

Copyright (c) 2015 Matt Waggoner (mattwaggs)
