# mq-router
A simple way to interact with a RabbitMQ server in nodejs

Sometimes you just need a simple way of sending messages from one service to another. MQ-Router aims to make interacting with a message queue similar to using the express router.

```javascript
var mq = require('mq-router');
// connect to RabbitMQ server
mq.init(connectionString).then(function() {
  // listen for requests on a specific queue
  mq.rpc.receive('route.path', function(req, res) {
    // do someting with the request.
    res.send(newData);
  });
  
});
```

There are currently two options for sending and receiving messages.
 - rpc
 - pub/sub

Both **rpc**, and **pub/sub** have a send(), and receive() function.

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

The third parameter in pubsub is the exchange type.  This can be **direct** or **fanout**. Direct will handle the messages in a round robbin way, while fanout will send the message to all receivers. 


Copyright (c) 2015 Matt Waggoner (mattwaggs)
