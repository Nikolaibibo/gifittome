var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var path = require('path');
var spawn = require('child_process').spawn;
var shell = require('shelljs');
var Twit = require('twit');
var fs = require('fs');

var T = new Twit({
  consumer_key: 'LZ08cNSka1M1j6wLpt3KKKpjy',
  consumer_secret: '078OMSZKEBFslpug7flCgNqZQfMq5GC9TrKjDe5sVfRrerUTpC',
  access_token: '2965830814-Y0m8FipYsyYkIkUbT2HqTbFEdBEbLP7Gu7AmqjD',
  access_token_secret: 'gV2tVBE1fLGVGTbFQLj6UqTXHvPS8icREkJuohrMX0rm9'
});




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

});

http.listen(3000, function(){
  console.log('listening on *:3000');
});







function captureImage () {
  shell.exec('raspistill -o ./public/images/cam.jpg -w 320 -h 240', function(code, output) {
    console.log("image created!");
    io.emit('image created');
  });
}


function captureVideo () {
  console.log("js captureVideo");
  shell.exec('rm -r -f /home/pi/nodejs/gifittome/public/videos/*', function(code, output) {
    //console.log('Exit code:', code);
    //console.log('Program output:', output);
    console.log("videos deleted");

    shell.exec('raspivid -o ./public/videos/video.h264 -w 400 -h 300 -t 5000', function(code, output) {
      console.log("video created!");

      shell.exec('MP4Box -fps 30 -add ./public/videos/video.h264 ./public/videos/video.mp4', function(code, output) {

        console.log("video converted");
        io.emit('video created');
      });
    });

  });
}

function createGIF () {
  console.log("js createGIF");

  shell.exec('ffmpeg -i ./public/videos/video.mp4 -vf "fps=15,scale=320:-1:flags=lanczos,palettegen" -y ./public/videos/palette.png', function(code, output) {
    console.log("palette created!");
    io.emit('palette created');

    shell.exec('ffmpeg -i ./public/videos/video.mp4 -i ./public/videos/palette.png -lavfi "fps=15,scale=320:-1:flags=lanczos [x]; [x][1:v] paletteuse" -y ./public/videos/video.gif', function(code, output) {
      console.log("GIF created");
      io.emit('gif created');
    });

  });
}


function tweetGIF () {
  console.log("js tweetGIF");

  // Load your image
  //var data = require('fs').readFileSync('./public/videos/video.gif');
  var b64content = fs.readFileSync('./public/videos/video.gif', { encoding: 'base64' })

  // first we must post the media to Twitter
  T.post('media/upload', { media_data: b64content }, function (err, data, response) {

    // now we can reference the media and post a tweet (media will attach to the tweet)
    var mediaIdStr = data.media_id_string
    var params = { status: '#GIF it to me', media_ids: [mediaIdStr] }

    T.post('statuses/update', params, function (err, data, response) {
      console.log(data)
    })
  })

}
