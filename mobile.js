var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var shell = require('shelljs');

var fs = require('fs');
var qr = require('qr-image');
var ip = require('ip');
var walk = require('walk');
var gpio = require("gpio");

var GpioHelper = require("./gpiohelper.js");
var FfmpegHelper = require("./ffmpeghelper.js");

var giffiles   = [];

var captureIsBusy = false;

// GPIO Helper and Events
var gpio_helper = new GpioHelper();
gpio_helper.on("button-released", function (resultobject) {
  console.log("button-released");
});
gpio_helper.on("button-down", function (resultobject) {
  console.log("button-down");
  if (captureIsBusy) {
    console.log("capture process running");
  }else{

    // green LED low
    gpio_helper.stopGreen();

    // red LED high
    gpio_helper.startBlinkingRed();

    // capturevideo
    captureIsBusy = true;
    ffmpeg_helper.captureVideo();
  }
});



// FFMPEG Helper
var ffmpeg_helper = new FfmpegHelper();
ffmpeg_helper.on("video-created", function (resultobject) {
  console.log("video-created");
  // create gif
  ffmpeg_helper.createGIF();
});

ffmpeg_helper.on("gif-created", function (tmpgifsrc) {
  console.log("gif-created :: " + tmpgifsrc);
  io.emit('gif created', tmpgifsrc);
});

ffmpeg_helper.on("qr-created", function (resultobject) {

  console.log("qr-created");

  gpio_helper.stopBlinkingRed();
  gpio_helper.startGreen();

  io.emit('qr created', tmppath);
});





// express.js PUBLIC STATIC FILES
app.use(express.static('public'));

// express.js ROUTING -> root
app.get('/', function(req, res, next){
  console.log("root page");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'button.html'));
});

// express.js ROUTING -> root
app.get('/gifs', function(req, res, next){
  console.log("gifs page");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'gifs.html'));
});


// socket.io -> on Connection
io.on('connection', function(socket){
  console.log('a user connected');
  // disconnect
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  // fetch GIFs
  socket.on('fetch gifs', fetchGIFs);

});


// listen on port
http.listen(3000, function(){
  console.log('listening on *:3000');
});


function fetchGIFs () {
  console.log('fetch gifs');

  // Walker options
  var files   = [];
  giffiles = [];
  var walker  = walk.walk('./public/images/gif', { followLinks: false });

  walker.on('file', function(root, stat, next) {
      files.push(root + '/' + stat.name);
      next();
  });

  walker.on('end', function() {
      for (var i = 0; i < files.length; i++) {
        var str = files[i];
        var strEdit = str.replace("./public", "");
        giffiles.push(strEdit);
      }
      io.emit("gifs fetched", giffiles);
  });
}




// wait for CTRL+C
process.on('SIGINT', shutdownAll);

function shutdownAll () {
  console.log("shutdownAll");

  gpio_helper.stopBlinkingRed();
  gpio_helper.stopRed();
  gpio_helper.stopYellow();
  gpio_helper.stopGreen();

  setTimeout(kill, 500);
}

function kill () {
  process.exit(0);
}
