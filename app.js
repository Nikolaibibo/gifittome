var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var spawn = require('child_process').spawn;

// PUBLIC STATIC FILES
app.use(express.static('public'));

app.get('/', function(req, res, next){
  //res.sendFile(path.join(__dirname, './public', 'start.html'));
  console.log("ready for raspi still");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'start.html'));
  //res.send('Hello from B!');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('chat message', function(msg){
    console.log('message: ' + msg);
    io.emit('chat message', msg);
  });

  socket.on('update image', function(msg){
    console.log('update image: ' + msg);


    var runShell = new run_shell('raspistill',['-o', './public/images/cam.jpg', '-w','800', '-h', '600'],
          function (me, buffer) {
              me.stdout += buffer.toString();
              //socket.emit("loading",{output: me.stdout});
              console.log(me.stdout);
           },
          function () {
              console.log("image created!");
              //child = spawn('omxplayer',[id+'.mp4']);
              io.emit('image created', msg);
          }
    );

    //io.emit('chat message', msg);
  });



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
