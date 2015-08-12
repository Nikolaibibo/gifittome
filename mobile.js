var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var walk = require('walk');

var GpioHelper = require("./gpiohelper.js");
var FfmpegHelper = require("./ffmpeghelper.js");

var giffiles   = [];
var captureIsBusy = false;

// #######################
// GPIO Helper and Events
// #######################
var gpio_helper = new GpioHelper();
gpio_helper.on("button-released", function (resultobject) {
  console.log("button-released");
});
gpio_helper.on("button-down", function (resultobject) {
  console.log("button-down");
  if (captureIsBusy) {
    console.log("capture process running! try again later...");
  }else{

    captureIsBusy = true;
    gpio_helper.doCountdownAnimation();

    setTimeout(function(){
      gpio_helper.stopGreen();
      gpio_helper.startBlinkingRed();
      gpio_helper.startBlinkingYellow();

      ffmpeg_helper.captureVideo();
    }, 1600);

  }
});

// #######################
// FFMPEG Helper
// #######################
var ffmpeg_helper = new FfmpegHelper();
ffmpeg_helper.on("video-created", function (resultobject) {
  console.log("video-created");
  gpio_helper.stopBlinkingYellow();
  // create gif
  ffmpeg_helper.createGIF();
});

ffmpeg_helper.on("gif-created", function (tmpgifsrc) {
  console.log("gif-created :: " + tmpgifsrc);
  io.emit('gif created', tmpgifsrc);
});

ffmpeg_helper.on("qr-created", function (resultobject) {

  console.log("qr-created");
  captureIsBusy = false;

  gpio_helper.stopBlinkingRed();
  gpio_helper.startGreen();

  io.emit('qr created', "leer");
});


// ###########################
// Express config and routing
// ###########################

// express.js PUBLIC STATIC FILES
app.use(express.static('public'));

// express.js ROUTING -> root
app.get('/', function(req, res, next){
  console.log("root page");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'result_simple.html'));
});

// express.js ROUTING -> serving gifs page
// fetch of gifs is triggered via socket.io
app.get('/gifs', function(req, res, next){
  console.log("gifs page");
  next();
}, function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'gifs.html'));
});

// listen on port
http.listen(3000, function(){
  console.log('listening on *:3000');
  gpio_helper.doStartAnimation();
});

// ###########################
// socket.io
// ###########################
io.on('connection', function(socket){
  console.log('a user connected');
  // disconnect
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  // fetch GIFs if browser loads the page and emits msg
  socket.on('fetch gifs', fetchGIFs);

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
  gpio_helper.stopBlinkingYellow();

  gpio_helper.doStopAnimation();

  setTimeout(kill, 650);
}

function kill () {
  process.exit(0);
}
