var express = require('express');
var spawn = require('child_process').spawn;

var router = express.Router();
var proc;

/* GET users listing. */
router.get('/', function(req, res, next) {
  //res.send('respond with a resource');
  var args = ["-w", "640", "-h", "480", "-o", "./public/images/image_stream.jpg"];
  proc = spawn('raspistill', args);

  res.render('start', { title: 'Start gifItToMe' });
});

module.exports = router;
