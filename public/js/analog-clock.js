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
  // spec.canvas.height = spec.canvas.height*2
  // spec.canvas.width = spec.canvas.width*2
  // spec.canvas.style.height = spec.canvas.height/4
  // spec.canvas.style.width = spec.canvas.width/4
  // spec.ctx.scale(2,2)
  spec.ctx = spec.canvas.getContext("2d")

  //appointments are items to show on the clock according to layout function
  spec.buses = spec.buses||[];

  //create a canvas to draw the static clockface, which will be drawn into the new canvas
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

      var i = 0;
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      while(i < 60) {
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
        i++
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
    var centerX = ctx.canvas.width / 2;
    var centerY = ctx.canvas.height / 2;

    ctx.save();
    ctx.beginPath();
    ctx.translate(centerX, centerY);
    ctx.rotate(-180 * Math.PI/180); // Correct for top left origin
    ctx.rotate(angle * Math.PI/180);
    // ctx.translate(0, 0-clockWidth/2);

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


    //show today's date
    var now = new Date()
    // var seconds = (spec.date.getSeconds()+(deltaT/1000));
    // var minutes = (spec.date.getMinutes()+(seconds/60));
		// var hours = (spec.date.getHours()+(minutes/60));
    var seconds = (now.getSeconds());
    var minutes = (now.getMinutes()+(seconds/60));
		var hours = (now.getHours()+(minutes/60));

		ctx.strokeStyle = "black";
		ctx.lineWidth = 4;
		drawHand(ctx, clockWidth/3, hours * 30);

		ctx.strokeStyle = "black";
		ctx.lineWidth = 2;
		drawHand(ctx, clockWidth/2, minutes * 6);

		ctx.strokeStyle = "red";
		ctx.lineWidth = 1;
    //make the second hand wiggle and forth
    var ms = 100 - (now.getMilliseconds()%1000)
    var dAngle = (ms > 0) ? Math.cos(ms*Math.PI*.045)*ms/1000 :0
    drawHand(ctx, clockWidth/2, (seconds+dAngle) * 6);

    ctx.save()
    ctx.lineWidth=40
    var msPerDay =1000*60*60*24
    var jan1 = new Date(now.getFullYear(), 0, 1)
    ctx.beginPath()
    var start = (now.getTime() - jan1.getTime())/msPerDay
    console.log(start);
    var phi1 = start/365.25*2*Math.PI
    var phi2 = (start +1)/365.25*2*Math.PI
    console.log(phi1*180/Math.PI);
    console.log(phi2*180/Math.PI);
    //show today as a wedge on the outside of the clock
    ctx.arc(ctx.canvas.width/2, ctx.canvas.height/2, ctx.canvas.width/2+5, phi1-Math.PI/2,  phi2-Math.PI/2)
    ctx.stroke()
    console.log("hi");
    ctx.restore()


    ctx.save()
    ctx.moveTo(ctx.canvas.width/2+x1,ctx.canvas.height/2+y1)
    var r1 = 150,
        r2 = 35,
        x1 = r1 * Math.cos(Math.PI/2-(hours) * 30*Math.PI/180),
        y1 = -r1 * Math.sin(Math.PI/2-(hours) * 30*Math.PI/180)

    for (dt = 0; dt<96; dt++) {
      x1 = (r1-r2*dt/24/4) * Math.cos(Math.PI/2-(hours+dt/4) * 30*Math.PI/180)
      y1 = (r1-r2*dt/24/4) * Math.sin(Math.PI/2-(hours+dt/4) * 30*Math.PI/180)

      // ctx.lineTo(ctx.canvas.width/2+x1,ctx.canvas.height/2+y1)
      // ctx.beginPath()
      //circles
      // ctx.arc(ctx.canvas.width/2+x1, ctx.canvas.height/2-y1, (r1-r2*dt/24/4)*2*Math.PI/96, 0, Math.PI*2)
      // ctx.fill()

      //spiral - circular gradient showing the next 24 hours
      ctx.lineWidth = r2/2
      // console.log("rgba("+Math.floor(dt/97*255)+",0,0,"+(1-dt/97)+")");
      ctx.strokeStyle="rgba("+Math.floor(dt/97*255)+",0,0,"+(1-dt/97)+")"
      ctx.beginPath()
      ctx.arc(ctx.canvas.width/2, ctx.canvas.height/2, (r1-r2*dt/24/4), (30*(hours+dt/4-1/4)-90)*Math.PI/180, (30*(hours+dt/4+1/4)-90)*Math.PI/180)
      ctx.stroke()
    }
    // ctx.stroke()
    ctx.restore()
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
