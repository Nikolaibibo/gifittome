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

var giffiles   = [];

var captureIsBusy = false;

var gpio_helper = new GpioHelper();
gpio_helper.on("button-released", function (resultobject) {
  console.log("button-released");
});
gpio_helper.on("button-down", function (resultobject) {
  console.log("button-down");
  if (captureIsBusy) {
    console.log("capture process running");
  }else{
    captureVideo();
  }
});

// config vars
// TODO: clean up
var target_file_still = "./public/images/cam.jpg";
var target_file_gif = './public/videos/video.gif';
var target_folder_gif_external_path = '/images/gif/';
var target_folder_gif_path = "./public/images/gif/"
var target_file_palette = "./public/videos/palette.png";
var target_file_mp4 = "./public/videos/video.mp4";
var target_file_h264 = "./public/videos/video.h264";
var target_file_qr = "./public/images/qr.png";

// shell string for shell.js
var shell_string_stillimage = "raspistill -o " + target_file_still + " -w 320 -h 240 -t 500";
var shell_string_delete = "rm -r -f /home/pi/nodejs/gifittome/public/videos/*";
var shell_string_create_video = "raspivid -o " + target_file_h264 + " -w 320 -h 240 -t 5000";
var shell_string_convert_video = "MP4Box -fps 15 -add " + target_file_h264 + " " + target_file_mp4;
var shell_string_ffmpeg_palette = "ffmpeg -i " + target_file_h264 + " -vf 'fps=15,scale=320:-1:flags=lanczos,palettegen' -y " + target_file_palette;
//var shell_string_ffmpeg_gif = "ffmpeg -i " + target_file_mp4 + " -i " + target_file_palette + " -lavfi 'fps=15,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse' -y " + target_file_gif;

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

// custom function for capturing video
function captureVideo () {
  console.log("js captureVideo");
  captureIsBusy = true;

  // green LED low
  gpio_helper.stopGreen();

  // red LED high
  gpio_helper.startBlinkingRed();

  shell.exec(shell_string_delete, function(code, output) {
    console.log("videos deleted");
    shell.exec(shell_string_create_video, function(code, output) {
      console.log("video created!");
      createGIF();
    });
  });
}

// custom function for converting GIF from *.h264
function createGIF () {
  console.log("js createGIF");

  shell.exec(shell_string_ffmpeg_palette, function(code, output) {
    console.log("palette created!");
    io.emit('palette created');

    // generate unique file name
    var d = new Date();
    var datestring = d.getDate() + "_" + d.getMonth() + "_" + d.getFullYear() + "_" + d.getHours() + "-" + d.getMinutes() + "_video.gif";
    target_file_gif = datestring;

    var shell_string_ffmpeg_gif = "ffmpeg -i " + target_file_h264 + " -i " + target_file_palette + " -lavfi 'fps=15,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse' -y " + target_folder_gif_path + target_file_gif;

    console.log("shell_string_ffmpeg_gif::::: " + shell_string_ffmpeg_gif);

    shell.exec(shell_string_ffmpeg_gif, function(code, output) {
      console.log("GIF created");

      // QR code generating
      var target_gif = "http://" + ip.address() + ":3000" + target_folder_gif_external_path + target_file_gif;
      console.log("#### GIF #### " + target_gif)
      var code = qr.image(target_gif, { type: 'png' });
      var output = fs.createWriteStream(target_file_qr);
      code.pipe(output);

      // wait a bit because of file output before emitting qr complete event
      setTimeout(function(){
        io.emit('qr created');
        //gpio16.set(0);
        gpio_helper.stopBlinkingRed();
        gpio_helper.startGreen();

        // remove after enabling auto-tweet
        captureIsBusy = false;

      }, 300);

      // gif path as message
      var tmppath = target_folder_gif_external_path + target_file_gif;

      io.emit('gif created', tmppath);
    });

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
