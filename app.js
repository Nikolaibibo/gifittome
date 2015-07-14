var express = require('express');
var http = require('http');
var path = require('path');
var io = require('socket.io')(http);
var spawn = require('child_process').spawn;


var app = express();

// PUBLIC STATIC FILES
app.use(express.static('public'));


// ROUTES
app.get('/', function (req, res, next) {


  console.log("ready for raspi still");
  var runShell = new run_shell('raspistill',['-o', './public/images/cam.jpg', '-w','800', '-h', '600'],
        function (me, buffer) {
            me.stdout += buffer.toString();
            //socket.emit("loading",{output: me.stdout});
            console.log(me.stdout);
         },
        function () {
            console.log("image created!");
            //child = spawn('omxplayer',[id+'.mp4']);

        }
    );


  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'a.html'));
  //res.send('Hello from B!');
});

app.get('/start', function (req, res, next) {

  res.sendFile(path.join(__dirname, './public', 'start.html'));
  console.log("start page served");

  /*
  var runShell = new run_shell('raspistill',['-o', './public/images/cam.jpg', '-w','800', '-h', '600'],
        function (me, buffer) {
            me.stdout += buffer.toString();
            //socket.emit("loading",{output: me.stdout});
            console.log(me.stdout);
         },
        function () {
            console.log("image created!");
            //child = spawn('omxplayer',[id+'.mp4']);

        });
      */
});

// IO
var sockets = {};

io.on('connection', function(socket) {

  sockets[socket.id] = socket;
  console.log("Total clients connected : ", Object.keys(sockets).length);

  socket.on('disconnect', function() {
    console.log("disconnect");
    delete sockets[socket.id];

    // no more sockets, kill the stream
    if (Object.keys(sockets).length == 0) {
      app.set('watchingFile', false);
      if (proc) proc.kill();
      fs.unwatchFile('./public/images/cam.jpg');

    }
  });

  socket.on('start-stream', function() {
    console.log("start stream");
    startStreaming(io);
  });
});

function stopStreaming() {
  if (Object.keys(sockets).length == 0) {
    app.set('watchingFile', false);
    if (proc) proc.kill();
    fs.unwatchFile('./stream/image_stream.jpg');
  }
}

function startStreaming(io) {

  if (app.get('watchingFile')) {
    io.sockets.emit('liveStream', 'cam.jpg?_t=' + (Math.random() * 100000));
    return;
  }

  var args = ["-w", "640", "-h", "480", "-o", "./public/images/cam.jpg", "-t", "999999999", "-tl", "1000"];
  proc = spawn('raspistill', args);

  console.log('Watching for changes...');

  app.set('watchingFile', true);

  fs.watchFile('./stream/image_stream.jpg', function(current, previous) {
    io.sockets.emit('liveStream', 'cam.jpg?_t=' + (Math.random() * 100000));
  })

}




// ERROR HANDLING
app.use(function(req, res, next) {
  res.status(404).send('Sorry cant find that!');
});
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});



// Server start
var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});


//Run and pipe shell script output
function run_shell(cmd, args, cb, end) {
    var spawn = require('child_process').spawn,
        child = spawn(cmd, args),
        me = this;
    child.stdout.on('data', function (buffer) { cb(me, buffer) });
    child.stdout.on('end', end);
}
