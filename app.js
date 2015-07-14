var express = require('express');
var path = require('path');
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

        });
});

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

function sayHello () {
  console.log("saying hello");
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
