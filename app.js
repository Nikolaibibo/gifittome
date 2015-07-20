var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var spawn = require('child_process').spawn;

// PUBLIC STATIC FILES
app.use(express.static('public'));


// root
app.get('/', function(req, res, next){
  //res.sendFile(path.join(__dirname, './public', 'start.html'));
  console.log("root page");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'start.html'));
  //res.send('Hello from B!');
});

// step1
app.get('/step1', function(req, res, next){
  //res.sendFile(path.join(__dirname, './public', 'start.html'));
  console.log("step1");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'step1.html'));
  //res.send('Hello from B!');
});




io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
    console.log('user disconnected');
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

  });

  socket.on('create video', function(){
    console.log('create video');

    var runShell = new run_shell('raspivid',['-o', './public/videos/video.h264', '-w','400', '-h', '300', '-t', '3000'],
          function (me, buffer) {
              me.stdout += buffer.toString();
              //socket.emit("loading",{output: me.stdout});
              console.log(me.stdout);
           },
          function () {
              console.log("video created! Now converting....");

              var runShell = new run_shell('MP4Box',['-fps', '30', '-add','./public/videos/video.h264', './public/videos/video.mp4'],
                    function (me, buffer) {
                        me.stdout += buffer.toString();
                        //socket.emit("loading",{output: me.stdout});
                        console.log(me.stdout);
                     },
                    function () {
                        console.log("video converted!");
                        //child = spawn('omxplayer',[id+'.mp4']);
                        io.emit('video created');
                        // MP4Box -fps 30 -add video.h264 video.mp4

                    }
                  );


          }
    );




  });



});

http.listen(3000, function(){
  console.log('listening on *:3000');
});


//Run and pipe shell script output
function run_shell(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    child.stdout.on('data', function (buffer) { cb(me, buffer) });
    child.stdout.on('end', end);
}
