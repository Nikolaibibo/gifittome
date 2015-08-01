var shell = require('shelljs');

var _this; // scoping shizzel
var captureIsBusy = false;

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



function FfmpegHelper () {
    EventEmitter.call(this);
    _this = this;
}
util.inherits(FfmpegHelper, EventEmitter);



FfmpegHelper.prototype.captureVideo = function () {

  console.log("FfmpegHelper captureVideo");
  captureIsBusy = true;

  // green LED low
  gpio_helper.stopGreen();

  // red LED high
  gpio_helper.startBlinkingRed();

  shell.exec(shell_string_delete, function(code, output) {
    console.log("videos deleted");
    shell.exec(shell_string_create_video, function(code, output) {
      console.log("video created");
      // TODO: bind to EventEmitter in mobile.js
      //createGIF();
    });
  });
}


FfmpegHelper.prototype.createGIF = function () {
  console.log("FfmpegHelper createGIF");

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



module.exports = FfmpegHelper;
