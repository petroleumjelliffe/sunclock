//CELESIAL GLOBE OBJECT DEFINITION
var CelestialGlobe= function(spec) {
  //spec is options sent to constructor
  spec.arcPoints = spec.arcPoints||{};
  spec.position = spec.position||{};
  spec.timestamp = spec.timestamp||new Date();
  console.log(spec.timestamp.toString());

  var that={};
  var labels = [
    {
      "azimuth":0,
      "altitude":0,
      "label":"S"
    }, {
      "azimuth":Math.PI/2,
      "altitude":0,
      "label":"W"
    }, {
      "azimuth":Math.PI,
      "altitude":0,
      "label":"N"
    }, {
      "azimuth":Math.PI/2*3,
      "altitude":0,
      "label":"E"
    }]

  //COORDINATE functions
  //translate polar coords as seen from side
  var xySide = function(azimuth, altitude, canvas, dAz) {

    var x = ((azimuth+dAz) / 2 / Math.PI +0.5 )%1*canvas.width;
    // var x = ((azimuth+dAz) / 2 / Math.PI * canvas.width) + canvas.width/2;
    var y = canvas.height - (Math.sin(altitude) * canvas.height);

    return {
      x: x,
      y: y
    };
  }
  //draw polar coords as seen from above
  var xyTop = function(azimuth, altitude, canvas, dAz) {
    dAz += Math.PI/2;  //correct for diff in 0º between the canvas and compass

    var r1 = Math.cos(altitude) * canvas.width/2
    var x = r1 * Math.cos(azimuth+dAz) + canvas.width/2
    var y = r1 * Math.sin(azimuth+dAz) + canvas.height/2

    return {
      x: x,
      y: y
    };
  }

  var halfGlobe = function(azimuth, altitude, canvas, dAz) {
    // dAz += Math.PI;  //correct for diff in 0º between the canvas and compass

    var r1 = -canvas.height
    var x = r1 * Math.cos(altitude) * Math.cos(azimuth+dAz+Math.PI/2) + canvas.width/2
    var y = r1 * Math.sin(altitude) + canvas.height

    return {
      x: x,
      y: y
    };
  }

  //DRAWING PRIMITIVES
  var drawDisc = function(func, sun, color, ctx, dAz) {
    // console.log(canvas);
    //
    // var ctx = canvas.getContext("2d");
    // console.log("ctx height: " + ctx.canvas.height);
    // console.log("canvas height: " + canvas.height);


    var p = func(sun.azimuth, sun.altitude, ctx.canvas, dAz)
    var r = ctx.canvas.height/10

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  var drawMoon = function(func, pos, src, ctx, dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    var p = func(pos.moon.azimuth, pos.moon.altitude, ctx.canvas, dAz)
    var r = c.height/10
    var apparentAngle  = -pos.moonPhase.angle + pos.moon.parallacticAngle - Math.PI/2;

    var img = document.createElement('IMG');
    //draw image after loading
    img.onload = function () {
      //assume spritesheet is made up of squares
      //h/w should be # of sprites
      var sprites = parseInt(img.naturalWidth / img.naturalHeight);
      var spriteOffset = Math.ceil(pos.moonPhase.phase*sprites)%sprites-1
      console.log(sprites)
      console.log(spriteOffset)
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(apparentAngle);
      ctx.translate(-p.x, -p.y);
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(this, spriteOffset * img.naturalHeight , 0, img.naturalHeight, img.naturalHeight, p.x-r,p.y-r, 2*r, 2*r);
      ctx.restore();
    }


    // Specify the src to load the image
    img.src = src; //triggers onLoad()
  }

  var drawShadow = function(pos, src, ctx, canvas, dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    // dAz+= Math.PI/2;

    var img = document.createElement('IMG');
    //draw image after loading
    img.onload = function () {
      var r =  c.height/ img.naturalHeight*.5
      var h = c.height/Math.tan(pos.altitude)*.5
      var w = r * img.naturalWidth

      console.log("shadow");
      ctx.save()
      // console.log(w);
      //center context on origin
      ctx.translate((c.width/2), (c.height/2));
      //rotate to opposite side of sun's azimuth
      ctx.rotate(pos.azimuth+dAz);
      ctx.translate((-c.width/2), (-c.height/2));

      // ctx.globalCompositeOperation = 'screen';
      // draw image with feet centered on center of image
      ctx.drawImage(this, 0,0, img.naturalWidth, img.naturalHeight, (c.width/2)-w/2,(c.height/2)-h, w, h);
      ctx.restore();
    }
    // Specify the src to load the image
    img.src = src; //triggers onLoad()
  }

  var drawArc = function(func, points, ctx, dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    // console.log(points);
    ctx.save();
    ctx.beginPath();
    points.reduce(function(p1, p2, i, array) {
      if (p1!== null && i>0) {
        var xy1 = func(p1.azimuth, p1.altitude, c, dAz)
        ctx.moveTo(xy1.x,xy1.y);

        var xy2 = func(p2.azimuth, p2.altitude, c, dAz)
        ctx.lineTo(xy2.x,xy2.y);
        ctx.stroke();
      }

      return p2;
    }, {} );
    ctx.closePath();
    ctx.restore();
  }



  //VIEW Functions
  that.sideView = function(ctx, /*arcPoints, position, */dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;
    ctx.clearRect(0,0,c.width, c.height)

    // var ctx =canvas.getContext("2d");
    // console.log(canvas);
    ctx.lineWidth = 0.25;
    ctx.strokeStyle = "#ffffff";

    //draw altitude lines
    for(var i=0; i<6; i++) {
      var y = Math.ceil(c.height* (1 - Math.sin(Math.PI* i /12))) +0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }
    //set up side view
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    //draw compass direction labels
    ctx.font = (c.height/56*10)+"px Arial";
    console.log("width: "+c.width);
    // ctx.fillText("E", (c.width * ((Math.PI/2+dAz) / (2 * Math.PI)+1))%c.width, c.height);
    // ctx.fillText("S", (c.width * (2 * Math.PI/2+dAz)/ (2 * Math.PI))%c.width, c.height);
    // ctx.fillText("W", (c.width * (3 * Math.PI/2+dAz)/ (2 * Math.PI))%c.width, c.height);
    labels.map(function(item, index, array){
      var p = xySide(item.azimuth, item.altitude, ctx.canvas, dAz )
      ctx.fillText(item.label, p.x, c.height)
    })
    console.log("spec.arcPoints:");
    // console.log(spec.arcPoints);
    //draw paths above horizon
    drawArc(xySide, spec.arcPoints.sun, ctx, dAz);
    drawArc(xySide, spec.arcPoints.moon, ctx, dAz);

    //draw sun and moon
    console.log("spec.position:");
    console.log(spec.position);
    drawMoon(xySide, spec.position, "img/phases-sheet.png", ctx, dAz)
    drawDisc(xySide, spec.position.sun, "#fdb813", ctx, dAz);
    // drawDisc(xySide, data.moon, "#ccc", c)
  }

  that.globeView = function(ctx, /*arcPoints, position,*/ dAz) {
    ctx.save();
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;
    ctx.clearRect(0,0,c.width, c.height)

    var y = Math.PI/2;
    // var centeredSun = 3*Math.PI/2 - data.sun.azimuth;
    // var leftSun = 2*Math.PI/2 - data.sun.azimuth;

    ctx.strokeStyle = "#ffffff";
    for(var i=0; i<6; i++) {
      var y = Math.ceil(c.height* (1 - Math.sin(Math.PI* i /12))) +0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    //draw compass direction labels
    ctx.font = (c.height/56*10)+"px Arial";

    labels.map(function(item, index, array){
      var p = halfGlobe(item.azimuth, item.altitude, ctx.canvas, dAz )
      ctx.fillText(item.label, p.x, c.height)
    })

    //draw globe view
    ctx.beginPath();
    ctx.arc(c.width/2,c.height,c.width/2,0,2*Math.PI);
    ctx.stroke();

    drawArc(halfGlobe, spec.arcPoints.sun, ctx, dAz);
    drawArc(halfGlobe, spec.arcPoints.moon, ctx, dAz);
    drawMoon(halfGlobe, spec.position, "img/phases-sheet.png", ctx, dAz)
    drawDisc(halfGlobe, spec.position.sun, "#fdb813", ctx, dAz);

    //draw globe view
    // globeCtx.beginPath();
    // globeCtx.moveTo(c.width/2, c.height);
    // var sunLeftPos = halfGlobe(spec.position.sun.azimuth, spec.position.sun.altitude, c, y+dAz);
    // globeCtx.lineTo(sunLeftPos.x, sunLeftPos.y)
    // // console.log(sunLeftPos);
    // // console.log(data.sun.altitude/Math.PI*180);
    // globeCtx.stroke();

    ctx.restore();

  }

  that.topView = function(ctx, /*arcPoints, position,*/ dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;
    ctx.clearRect(0,0,c.width, c.height)

    // ctx.fillStyle = colors[data.partOfDay];
    ctx.fillStyle="#ccc"

    //draw top view
    ctx.beginPath();
    ctx.arc(c.width/2, c.height/2, c.width/2,0,2*Math.PI);
    ctx.stroke();


    drawArc(xyTop, spec.arcPoints.sun, ctx, dAz);
    drawArc(xyTop, spec.arcPoints.moon, ctx, dAz);

    drawShadow(spec.position.sun,"img/shadow.png", ctx, topCanvas[0], dAz)

    drawMoon(xyTop, spec.position, "img/phases-sheet.png", ctx, dAz)
    drawDisc(xyTop, spec.position.sun, "#fdb813", ctx, dAz);
    // drawDisc(xyTop, data.moon, "#ccc", topCanvas[0])
  }

  that.updateArcs = function(callback) {
    $.getJSON("/sunmoon/positions", function(newArcPoints) {
      spec.arcPoints = newArcPoints;

      callback();
    })
  }
  that.updatePosition = function(callback) {

    $.getJSON("/sunmoon/now", {
      "lat":40.6816778, //NYC
      "lon":-73.9962808, //NYC
      "timestamp": spec.timestamp.toJSON()},
      function(newPosition) {
      spec.position = newPosition;

      callback();
    })
  }

  that.getPartOfDay = function() {
    return spec.position.partOfDay;
  }

  that.setDate = function(string) {
    spec.timestamp = new Date(string)
  }

  that.setTime = function(hours, minutes) {
    spec.timestamp.setHours(hours, minutes)
  }

  that.getTime = function() {
    return spec.timestamp.toString();
  }

  return that;
}