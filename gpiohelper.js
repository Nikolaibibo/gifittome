var EventEmitter        = require("events").EventEmitter;
var util                = require("util");
var gpio                = require("gpio");

var _this; // scoping shizzel
var blinkRedInterval;
var blinkYellowInterval;



// Button code
var gpio20 = gpio.export(20, {
   direction: "in",
   //interval: 200,
   ready: function() {
     console.log("Button ready");
   }
});

gpio20.on("change", function(val) {
   if (val == 1) {
     //console.log("button release");
     _this.emit("button-released", "testdata");

   }else if (val == 0) {
     //console.log("button down");
     _this.emit("button-down", "testdata");
   }
});




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
     //gpio12.set();
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

// yellow LED blinking
function toggleYellowLED () {
  if (gpio26.value == 1) {
    gpio26.set(0);
  } else {
    gpio26.set();
  }
}






function GpioHelper () {
    EventEmitter.call(this);
    _this = this;
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
  clearInterval(blinkRedInterval);
  gpio16.set(0);
}


GpioHelper.prototype.startGreen = function () {
  gpio12.set();
}
GpioHelper.prototype.stopGreen = function () {
  gpio12.set(0);
}


GpioHelper.prototype.startBlinkingYellow = function () {
  blinkYellowInterval = setInterval(toggleYellowLED, 250);
}
GpioHelper.prototype.stopBlinkingYellow = function () {
  clearInterval(blinkYellowInterval);
  gpio26.set(0);
}

GpioHelper.prototype.startYellow = function () {
  gpio26.set();
}
GpioHelper.prototype.stopYellow = function () {
  clearInterval(blinkYellowInterval);
  gpio26.set(0);
}


// animations
GpioHelper.prototype.doStartAnimation = function () {

  // red
  setTimeout(function(){ gpio16.set(); }, 200);
  setTimeout(function(){ gpio16.set(0); }, 300);
  // yellow
  setTimeout(function(){ gpio26.set(); }, 400);
  setTimeout(function(){ gpio26.set(0); }, 500);
  // green
  setTimeout(function(){ gpio12.set(); }, 600);
  setTimeout(function(){ gpio12.set(0); }, 700);

  // red
  setTimeout(function(){ gpio16.set(); }, 800);
  setTimeout(function(){ gpio16.set(0); }, 900);
  // yellow
  setTimeout(function(){ gpio26.set(); }, 1000);
  setTimeout(function(){ gpio26.set(0); }, 1100);
  // green
  setTimeout(function(){ gpio12.set(); }, 1200);
  setTimeout(function(){ gpio12.set(0); }, 1300);

  // green
  setTimeout(function(){ gpio12.set(); }, 1500);
}



// turn off animation
GpioHelper.prototype.doStopAnimation = function () {

  // red
  setTimeout(function(){ gpio16.set(); }, 100);
  // yellow
  setTimeout(function(){ gpio26.set(); }, 200);
  // green
  setTimeout(function(){ gpio12.set(); }, 300);

  setTimeout(function(){ gpio16.set(0); }, 400);
  // yellow
  setTimeout(function(){ gpio26.set(0); }, 500);
  // green
  setTimeout(function(){ gpio12.set(0); }, 600);

}


module.exports = GpioHelper;
