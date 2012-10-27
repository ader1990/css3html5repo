var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs')

app.listen(90);

function handler (req, res) {
 
}

//app.listen(90);

var sockets=[];
io.sockets.on('connection', function (socket) {

    if(sockets.indexOf(socket)<0)
        sockets.push(socket);
    
    socket.on('client_keypress', function (data) {
        for(var i in sockets)
            sockets[i].emit('client_inform', {
                data: data
            });
    });
});