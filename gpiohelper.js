var EventEmitter        = require("events").EventEmitter;
var util                = require("util");
var gpio                = require("gpio");

var _this; // scoping shizzel
var blinkRedInterval;



// LED red code
var gpio16 = gpio.export(16, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("red LED ready");
   }
});

// LED yellow code
var gpio26 = gpio.export(26, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("yellow LED ready");
   }
});

// LED green code
var gpio12 = gpio.export(12, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("green LED ready");
     gpio12.set();
   }
});

// red LED blinking
function toggleRedLED () {
  if (gpio16.value == 1) {
    gpio16.set(0);
  } else {
    gpio16.set();
  }
}






function GpioHelper () {
    EventEmitter.call(this);
}
util.inherits(GpioHelper, EventEmitter);


GpioHelper.prototype.startBlinkingRed = function () {
  blinkRedInterval = setInterval(toggleRedLED, 250);
}
GpioHelper.prototype.stopBlinkingRed = function () {
  clearInterval(blinkRedInterval);
  gpio16.set(0);
}
GpioHelper.prototype.stopRed = function () {
  gpio16.set(0);
}


GpioHelper.prototype.startGreen = function () {
  gpio12.set();
}
GpioHelper.prototype.stopGreen = function () {
  gpio12.set(0);
}


GpioHelper.prototype.startYellow = function () {
  gpio26.set();
}
GpioHelper.prototype.stopYellow = function () {
  gpio26.set(0);
}

module.exports = GpioHelper;
