var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require("redis");


io.on('connection', function(socket){

    var clientSubscription = redis.createClient({"host": "redis"});
    socket.on("token",function (data) {
        console.log(data);
        clientSubscription.subscribe(data);
        clientSubscription.on("message", function (channel, message) {
            console.log(message);
            socket.emit('RedisData', { "data": message });
        })
    });
    socket.on('disconnect', function(){
        clientSubscription.unsubscribe();
        clientSubscription.quit();
        console.log('user disconnected');
    });
});

http.listen(3000, function(){
    console.log('listening on *:3000');
});
