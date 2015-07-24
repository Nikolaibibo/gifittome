// TODO: finish
var _this; // scoping shizzel


function GifBrowser () {
    EventEmitter.call(this);
}
util.inherits(GifBrowser, EventEmitter);

GifBrowser.prototype.fetchGifs = function () {

  _this = this;
  var result_emitter      = new EventEmitter();
  // Listen for updates
  result_emitter.emit("data", data);
}

module.exports = GifBrowser;
