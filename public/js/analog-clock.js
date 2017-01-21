/**
 * Setup and start an analog clock using a canvas
 * @param canvas The canvas to use
 * @param clockWidth The width of the clock (radius*2)
 * @author Lyndon Armitage
 */

// clock object has draw function that shows static, hands, and milestones?

//CLOCK OBJECT DEFINITION
var AnalogClock = function(canvas, spec) {
  //spec is options sent to constructor
  spec.canvas = canvas;

  //appointments are items to show on the clock according to layout function
  spec.buses = spec.buses||[];
  var newCanvas = document.createElement("canvas")
  newCanvas.height = 500
  newCanvas.width = 500

  var ctxFace = newCanvas.getContext("2d")


  var drawStatic = function(ctx) {
    var centerX = spec.canvas.width / 2;
    var centerY = spec.canvas.height / 2;
    var clockWidth = spec.clockWidth;

    ctx.beginPath();
    ctx.arc(centerX, centerY, clockWidth/2, 0, 2 * Math.PI, false);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 2, 0, 2 * Math.PI, false);
    console.log('arc');
    ctx.fillStyle = "black";
    ctx.fill();
    ctx.closePath();

    drawNumbers();

    function drawNumbers() {

      var i = 60;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      while(i > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.translate(centerX, centerY);
        var angle = (i * 6) * Math.PI/180;
        ctx.rotate(angle);
        ctx.translate(0, -clockWidth/2);

        // Drawing numbers doesn't look so good because of the origin of the text
        // ctx.save();
        // ctx.translate(0, -10);
        // ctx.rotate(-angle);
        // ctx.fillText(i, -3, 0);
        // ctx.restore();
        //
        ctx.moveTo(0, 0);
        if (i%5 == 0) {
          ctx.lineWidth = 2
          ctx.lineTo(0, 10);

        } else {
          ctx.lineTo(0, 5);

        }
        ctx.stroke();
        // ctx.closePath();
        ctx.restore();
        i --;
      }
    }

    return ctx.canvas
  }

  spec.face = spec.face || drawStatic(ctxFace)

  //canvas is required
  spec.clockWidth = spec.clockWidth||canvas.width

  var interval = null;

  console.log("create Analog Clock object");


  var that={};


  that.stop = function() {
    console.log(interval);
    window.cancelAnimationFrame(interval)
  }

  var drawHand = function(ctx, length, angle) {
    var centerX = spec.canvas.width / 2;
    var centerY = spec.canvas.height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.translate(centerX, centerY);
    ctx.rotate(-180 * Math.PI/180); // Correct for top left origin
    ctx.rotate(angle * Math.PI/180);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, length);
    ctx.stroke();
    ctx.closePath();
    ctx.restore();
  }


  //layout is a function that is called with tick, and has a reference to the same canvas
  var tick = function (deltaT) {
    var ctx = spec.canvas.getContext("2d");
    var clockWidth = spec.clockWidth;

    //draw static, hands, and icons
		// var date = new Date();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// drawStatic(ctx);
    ctx.drawImage(spec.face, 0, 0)

    var seconds = (spec.date.getSeconds()+(deltaT/1000));
    var minutes = (spec.date.getMinutes()+(seconds/60));
		var hours = (spec.date.getHours()+(minutes/60));

		ctx.strokeStyle = "black";
		ctx.lineWidth = 4;
		drawHand(ctx, clockWidth/3, hours * 30);

		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		drawHand(ctx, clockWidth/2, minutes * 6);

		ctx.strokeStyle = "red";
		ctx.lineWidth = 1;
    //make the second hand snap wiggle and forth
    var wiggle = Math.floor(seconds)
    var ms = 100 - (deltaT%1000)
    // var dAngle = Math.cos(correction*Math.PI/18)*Math.exp(-.1*correction/2)
    var dAngle = (ms > 0) ? Math.cos(ms*Math.PI*.045)*ms/1000 :0
    drawHand(ctx, clockWidth/2, (wiggle+dAngle) * 6);
    // drawHand(ctx, clockWidth/2, (wiggle) * 6);

    //draw icons
    spec.layout(canvas);
	}

  that.setBuses= function(buses) {
    //buses is an array of buses and their arrival times

      spec.buses = buses

  };
  var date = null;
  that.begin = function(timestamp) {
    console.log("timestamp");
    console.log(timestamp);
    // if (interval !== null) {
    //   window.cancelAnimationFrame(interval);
    // }
    spec.date = spec.date || new Date();

    tick(timestamp);
    // interval = window.setInterval(tick, 1000);
    interval = window.requestAnimationFrame(that.begin)
  }

  return that;
}