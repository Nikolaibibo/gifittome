var express = require('express');
var spawn = require('child_process').spawn;
var RaspiCam = require("raspicam");

var router = express.Router();
var proc;

var camera = new RaspiCam({
  mode:"photo",
  encoding: "jpg",
  output: './public/images/raspicam.jpg',
  quality: 50,
  width:500,
  height:272
});

camera.on("started", function( err, timestamp ){
	console.log("photo started at " + timestamp );
});

camera.on("read", function( err, timestamp, filename ){
	console.log("photo image captured with filename: " + filename );
});

camera.on("exit", function( timestamp ){
	console.log("photo child process has exited at " + timestamp );
  camera.stop();
});



/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  //var args = ["-w", "640", "-h", "480", "-o", "./public/images/image_stream.jpg"];
  //proc = spawn('raspistill', args);
  camera.start();

  res.render('start', { title: 'Start gifItToMe', random:Math.random() });
});

module.exports = router;
