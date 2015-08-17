var EventEmitter        = require("events").EventEmitter;
var util                = require("util");
var shell               = require('shelljs');
var ip                  = require('ip');
var fs                  = require('fs');
var qr                  = require('qr-image');

var _this; // scoping shizzel

// config vars
// TODO: clean up
var target_file_still = "/home/pi/nodejs/gifittome/public/images/cam.jpg";
var target_file_gif = '/home/pi/nodejs/gifittome/public/videos/video.gif';
var target_folder_gif_external_path = '/images/gif/';
var target_folder_gif_path = "/home/pi/nodejs/gifittome/public/images/gif/";
var target_file_watermark = "/home/pi/nodejs/gifittome/public/images/watermark.png";
var target_file_palette = "/home/pi/nodejs/gifittome/public/videos/palette.png";
var target_file_mp4 = "/home/pi/nodejs/gifittome/public/videos/video.mp4";
var target_file_h264 = "/home/pi/nodejs/gifittome/public/videos/video.h264";
var target_file_qr = "/home/pi/nodejs/gifittome/public/images/qr.png";

// shell string for shell.js
var shell_string_stillimage = "raspistill -o " + target_file_still + " -w 600 -h 400 -t 500";
var shell_string_delete = "rm -r -f /home/pi/nodejs/gifittome/public/videos/*";
var shell_string_create_video = "raspivid -o " + target_file_h264 + " -fps 25 -w 600 -h 400 -t 5000";
var shell_string_create_watermark = "ffmpeg -i " + target_file_h264 + " -i " + target_file_watermark + " -filter_complex 'overlay=10:10' " + target_file_mp4;
var shell_string_ffmpeg_palette = "ffmpeg -i " + target_file_h264 + " -vf 'fps=5,scale=600:-1:flags=lanczos,palettegen' -y " + target_file_palette;


function FfmpegHelper () {
    EventEmitter.call(this);
    _this = this;
}
util.inherits(FfmpegHelper, EventEmitter);

FfmpegHelper.prototype.captureStillImage = function () {
  shell.exec(shell_string_stillimage, function(code, output) {
    console.log("still image created!");
    _this.emit("stillimage-created", "testdata");
    //io.emit('image created');
  });
}

FfmpegHelper.prototype.captureVideo = function () {

  console.log("FfmpegHelper captureVideo");

  shell.exec(shell_string_delete, function(code, output) {
    console.log("videos deleted");
    shell.exec(shell_string_create_video, function(code, output) {
      console.log("video created");
      _this.emit("video-created", "testdata");
    });
  });
}

FfmpegHelper.prototype.createWatermark = function () {

  shell.exec(shell_string_create_watermark, function(code, output) {
    console.log("watermark created");
    _this.emit("watermark-created", "watermark");
  });
}

FfmpegHelper.prototype.createGIF = function () {
  console.log("FfmpegHelper createGIF");

  shell.exec(shell_string_ffmpeg_palette, function(code, output) {

    console.log("palette created!");

    // generate unique file name
    var d = new Date();
    var datestring = d.getDate() + "_" + d.getMonth() + "_" + d.getFullYear() + "_" + d.getHours() + "-" + d.getMinutes() + "_video.gif";
    target_file_gif = datestring;

    var shell_string_ffmpeg_gif = "ffmpeg -i " + target_file_h264 + " -i " + target_file_palette + " -lavfi 'fps=15,scale=400:-1:flags=lanczos [x]; [x][1:v] paletteuse' -y " + target_folder_gif_path + target_file_gif;
    console.log("shell_string_ffmpeg_gif::::: " + shell_string_ffmpeg_gif);

    shell.exec(shell_string_ffmpeg_gif, function(code, output) {
      console.log("GIF created");

      // QR code generating
      var target_gif = "http://" + ip.address() + ":3000" + target_folder_gif_external_path + target_file_gif;
      console.log("#### GIF #### " + target_gif)
      var code = qr.image(target_gif, { type: 'png' });
      var output = fs.createWriteStream(target_file_qr);
      code.pipe(output);

      // wait a bit because of file output before emitting qr complete event,
      // TODO: change to callback
      setTimeout(function(){
        _this.emit("qr-created", "leer");
      }, 300);

      // pass gif path as message
      var tmppath = target_folder_gif_external_path + target_file_gif;
      _this.emit("gif-created", tmppath);
    });

  });
}

module.exports = FfmpegHelper;
