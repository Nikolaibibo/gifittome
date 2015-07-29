var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var spawn = require('child_process').spawn;
var shell = require('shelljs');
var Twit = require('twit');
var fs = require('fs');
var qr = require('qr-image');
var ip = require('ip');
var walk = require('walk');
//var pfio = require('piface-node');
var gpio = require("gpio");

var credentials = require('./twitter_credentials.json');

var giffiles   = [];
var prev_state = 0;

// twitter credentials
var T = new Twit({
  consumer_key: credentials.twitter_consumer_key,
  consumer_secret: credentials.twitter_consumer_secret,
  access_token: credentials.twitter_access_token_key,
  access_token_secret: credentials.twitter_access_token_secret
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
var shell_string_create_video = "raspivid -o " + target_file_h264 + " -w 400 -h 300 -t 5000";
var shell_string_convert_video = "MP4Box -fps 30 -add " + target_file_h264 + " " + target_file_mp4;
var shell_string_ffmpeg_palette = "ffmpeg -i " + target_file_mp4 + " -vf 'fps=15,scale=320:-1:flags=lanczos,palettegen' -y " + target_file_palette;
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

// variable holder for callback function gifs fetched
//var io_socket;
// socket.io -> on Connection
io.on('connection', function(socket){

  //io_socket = socket;

  console.log('a user connected');
  // disconnect
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
  // generate and update the image
  //socket.on('update image', captureImage);
  // generate and update the video
  socket.on('create video', captureVideo);
  // generate GIF from video
  socket.on('create gif', createGIF);
  // tweet GIF
  socket.on('tweet gif', tweetGIF);
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

// custom function for capturing video
function captureVideo () {
  console.log("js captureVideo");
  shell.exec(shell_string_delete, function(code, output) {
    console.log("videos deleted");

    shell.exec(shell_string_create_video, function(code, output) {
      console.log("video created!");

      shell.exec(shell_string_convert_video, function(code, output) {

        console.log("video converted");
        //io.emit('video created');
        createGIF();
      });
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

    var shell_string_ffmpeg_gif = "ffmpeg -i " + target_file_mp4 + " -i " + target_file_palette + " -lavfi 'fps=15,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse' -y " + target_folder_gif_path + target_file_gif;

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

        tweetGIF();
      }, 300);

      // gif path as message
      var tmppath = target_folder_gif_external_path + target_file_gif;

      io.emit('gif created', tmppath);
    });

  });
}

// custom function for tweeting generated GIF
function tweetGIF () {
  console.log("js tweetGIF");

  // Load your image
  //var data = require('fs').readFileSync('./public/videos/video.gif');
  var b64content = fs.readFileSync(target_folder_gif_path + target_file_gif, { encoding: 'base64' })

  // first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {

    // now we can reference the media and post a tweet (media will attach to the tweet)
    var mediaIdStr = data.media_id_string
    var params = { status: '#GIF_it_to_me', media_ids: [mediaIdStr] }

    T.post('statuses/update', params, function (err, data, response) {
      console.log("tweeted image succesful");
      io.emit('gif tweeted');
    })
  })

}

var gpio20 = gpio.export(20, {
   direction: "in",
   //interval: 200,
   ready: function() {
     console.log("ping");
   }
});

gpio20.on("change", function(val) {
   // value will report either 1 or 0 (number) when the value changes
   //console.log(val)

   if (val == 1) {
     console.log("button release");
   }else if (val == 0) {
     console.log("button down");
   }
});
