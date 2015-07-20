var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var spawn = require('child_process').spawn;
var shell = require('shelljs');

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



// on Connection
io.on('connection', function(socket){

  console.log('a user connected');

  // disconnect
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  // generate and update the image
  socket.on('update image', function(){
    console.log('update image');
    captureImage();
  });

  // generate and update the video
  socket.on('create video', function(){
    console.log('create video');
    captureVideo();
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

    //me.stdout = "";

    child.stdout.on('data', function (buffer) { cb(me, buffer) });
    child.stdout.on('end', end);
}

function captureImage () {

  shell.exec('raspistill -o ./public/images/cam.jpg -w 320 -h 240', function(code, output) {
    console.log("image created!");
    io.emit('image created');
  });
  /*
  var runShell = new run_shell('raspistill',['-o', './public/images/cam.jpg', '-w','800', '-h', '600'],
        function (me, buffer) {
            me.stdout += buffer.toString();
            //socket.emit("loading",{output: me.stdout});
            console.log(me.stdout);
         },
        function () {
            console.log("image created!");
            io.emit('image created');
        }
  );
  */
}


function captureVideo () {
  shell.exec('rm -r -f /home/pi/nodejs/gifittome/public/videos/*', function(code, output) {
    //console.log('Exit code:', code);
    //console.log('Program output:', output);
    console.log("videos deleted");

    var runShell = new run_shell('raspivid',['-o', './public/videos/video.h264', '-w','400', '-h', '300', '-t', '5000'],
          function (me, buffer) {},
          function () {
              console.log("video created! Now converting....");
              var runShell = new run_shell('MP4Box',['-fps', '30', '-add','./public/videos/video.h264', './public/videos/video.mp4'],
                    function (me, buffer) { },
                    function () {
                      console.log("video converted!");
                      io.emit('video created');
                    }
              );
          }
    );
  });
}
