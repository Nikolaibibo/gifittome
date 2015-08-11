var EventEmitter        = require("events").EventEmitter;
var util                = require("util");
var gpio                = require("gpio");

var _this; // scoping shizzel
var blinkRedInterval;
var blinkYellowInterval;



// Button code
var gpio20_button = gpio.export(20, {
   direction: "in",
   //interval: 200,
   ready: function() {
     console.log("Button ready");
   }
});

gpio20_button.on("change", function(val) {
   if (val == 1) {
     //console.log("button release");
     _this.emit("button-released", "testdata");

   }else if (val == 0) {
     //console.log("button down");
     _this.emit("button-down", "testdata");
   }
});




// LED red code
var gpio16_red = gpio.export(16, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("red LED ready");
   }
});

// LED yellow code
var gpio26_yellow = gpio.export(26, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("yellow LED ready");
   }
});

// LED green code
var gpio12_green = gpio.export(12, {
   direction: 'out',
   interval: 200,
   ready: function() {
     console.log("green LED ready");
     //gpio12_green.set();
   }
});

// red LED blinking
function toggleRedLED () {
  if (gpio16_red.value == 1) {
    gpio16_red.set(0);
  } else {
    gpio16_red.set();
  }
}

// yellow LED blinking
function toggleYellowLED () {
  if (gpio26_yellow.value == 1) {
    gpio26_yellow.set(0);
  } else {
    gpio26_yellow.set();
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
  gpio16_red.set(0);
}
GpioHelper.prototype.stopRed = function () {
  clearInterval(blinkRedInterval);
  gpio16_red.set(0);
}


GpioHelper.prototype.startGreen = function () {
  gpio12_green.set();
}
GpioHelper.prototype.stopGreen = function () {
  gpio12_green.set(0);
}


GpioHelper.prototype.startBlinkingYellow = function () {
  blinkYellowInterval = setInterval(toggleYellowLED, 250);
}
GpioHelper.prototype.stopBlinkingYellow = function () {
  clearInterval(blinkYellowInterval);
  gpio26_yellow.set(0);
}

GpioHelper.prototype.startYellow = function () {
  gpio26_yellow.set();
}
GpioHelper.prototype.stopYellow = function () {
  clearInterval(blinkYellowInterval);
  gpio26_yellow.set(0);
}


// animations
GpioHelper.prototype.doCountdownAnimation = function () {

  gpio12_green.set(0);

  setTimeout(function(){ gpio16_red.set(); }, 50);
  setTimeout(function(){ gpio16_red.set(0); }, 100);
  setTimeout(function(){ gpio16_red.set(); }, 150);
  setTimeout(function(){ gpio16_red.set(0); }, 200);
  setTimeout(function(){ gpio16_red.set(); }, 250);
  setTimeout(function(){ gpio16_red.set(0); }, 300);

  setTimeout(function(){ gpio26_yellow.set(); }, 350);
  setTimeout(function(){ gpio26_yellow.set(0); }, 400);
  setTimeout(function(){ gpio26_yellow.set(); }, 450);
  setTimeout(function(){ gpio26_yellow.set(0); }, 500);
  setTimeout(function(){ gpio26_yellow.set(); }, 550);
  setTimeout(function(){ gpio26_yellow.set(0); }, 600);

  setTimeout(function(){ gpio12_green.set(); }, 750);
  setTimeout(function(){ gpio12_green.set(0); }, 800);
  setTimeout(function(){ gpio12_green.set(); }, 850);
  setTimeout(function(){ gpio12_green.set(0); }, 900);
  setTimeout(function(){ gpio12_green.set(); }, 950);
  setTimeout(function(){ gpio12_green.set(0); }, 1000);

}

GpioHelper.prototype.doStartAnimation = function () {

  // red
  setTimeout(function(){ gpio16_red.set(); }, 200);
  setTimeout(function(){ gpio16_red.set(0); }, 300);
  // yellow
  setTimeout(function(){ gpio26_yellow.set(); }, 400);
  setTimeout(function(){ gpio26_yellow.set(0); }, 500);
  // green
  setTimeout(function(){ gpio12_green.set(); }, 600);
  setTimeout(function(){ gpio12_green.set(0); }, 700);

  // red
  setTimeout(function(){ gpio16_red.set(); }, 800);
  setTimeout(function(){ gpio16_red.set(0); }, 900);
  // yellow
  setTimeout(function(){ gpio26_yellow.set(); }, 1000);
  setTimeout(function(){ gpio26_yellow.set(0); }, 1100);
  // green
  setTimeout(function(){ gpio12_green.set(); }, 1200);
  setTimeout(function(){ gpio12_green.set(0); }, 1300);

  // green
  setTimeout(function(){ gpio12_green.set(); }, 1500);
}



// turn off animation
GpioHelper.prototype.doStopAnimation = function () {

  // red
  setTimeout(function(){ gpio16_red.set(); }, 100);
  // yellow
  setTimeout(function(){ gpio26_yellow.set(); }, 200);
  // green
  setTimeout(function(){ gpio12_green.set(); }, 300);

  setTimeout(function(){ gpio16_red.set(0); }, 400);
  // yellow
  setTimeout(function(){ gpio26_yellow.set(0); }, 500);
  // green
  setTimeout(function(){ gpio12_green.set(0); }, 600);

}


module.exports = GpioHelper;
