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
var os = require('os');
var ip = require('ip');
var walk    = require('walk');

var ifaces = os.networkInterfaces();

var giffiles   = [];


// twitter credentials
var T = new Twit({
  consumer_key: 'LZ08cNSka1M1j6wLpt3KKKpjy',
  consumer_secret: '078OMSZKEBFslpug7flCgNqZQfMq5GC9TrKjDe5sVfRrerUTpC',
  access_token: '2965830814-Y0m8FipYsyYkIkUbT2HqTbFEdBEbLP7Gu7AmqjD',
  access_token_secret: 'gV2tVBE1fLGVGTbFQLj6UqTXHvPS8icREkJuohrMX0rm9'
});

// config vars
var ipadress = "127.0.0.1";
var target_file_still = "./public/images/cam.jpg";
var target_file_gif = './public/videos/video.gif';
var target_folder_gif_external_path = '/images/gif/';
var target_folder_gif_path = "./public/images/gif/"
var target_file_palette = "./public/videos/palette.png";
var target_file_mp4 = "./public/videos/video.mp4";
var target_file_h264 = "./public/videos/video.h264";
var target_file_qr = "./public/images/qr.png";

// shell string for shell.js
var shell_string_stillimage = "raspistill -o " + target_file_still + " -w 320 -h 240";
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
  res.sendFile(path.join(__dirname, './public', 'start.html'));
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

  // generate GIF from video
  socket.on('create gif', function(){
    console.log('create gif');
    createGIF();
  });

  // tweet GIF
  socket.on('tweet gif', function(){
    console.log('tweet gif');
    tweetGIF();
  });

  // fetch GIFs
  socket.on('fetch gifs', function(){
    console.log('fetch gifs');

    // Walker options
    var walker  = walk.walk('./images/gif', { followLinks: false });

    walker.on('file', function(root, stat, next) {
        // Add this file to the list of files
        giffiles.push(root + '/' + stat.name);
        next();
    });

    walker.on('end', function() {
        console.log(giffiles);
    });



    socket.emit("gifs fetched");
  });

});


// listen on port
http.listen(3000, function(){
  console.log('listening on *:3000');
});





// custom function for capturing image
function captureImage () {
  shell.exec(shell_string_stillimage, function(code, output) {
    console.log("image created!");
    io.emit('image created');
  });
}

// custom function for capturing video
function captureVideo () {
  console.log("js captureVideo");
  shell.exec(shell_string_delete, function(code, output) {
    //console.log('Exit code:', code);
    //console.log('Program output:', output);
    console.log("videos deleted");

    shell.exec(shell_string_create_video, function(code, output) {
      console.log("video created!");

      shell.exec(shell_string_convert_video, function(code, output) {

        console.log("video converted");
        io.emit('video created');

        // todo: fix this ;)
        getIP();
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
      }, 500);

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
  var b64content = fs.readFileSync(target_file_gif, { encoding: 'base64' })

  // first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {

    // now we can reference the media and post a tweet (media will attach to the tweet)
    var mediaIdStr = data.media_id_string
    var params = { status: '#GIF it to me', media_ids: [mediaIdStr] }

    T.post('statuses/update', params, function (err, data, response) {
      //console.log(data);
      io.emit('gif tweeted');
    })
  })

}

// custom function for gathering IP adresses for qr code generation
function getIP () {
  Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface) {
      if ('IPv4' !== iface.family || iface.internal !== false) {
        // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
        return;
      }

      if (alias >= 1) {
        // this single interface has multiple ipv4 addresses
        console.log("multiple ip addresses");
        console.log(ifname + ':' + alias, iface.address);
        ipadress = iface.adress;

      } else {
        // this interface has only one ipv4 adress
        console.log("single ip adress");
        console.log(ifname, iface.address);
        ipadress = iface.adress;
      }
    });
  });

}
