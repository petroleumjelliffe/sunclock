//format

//CELESIAL GLOBE OBJECT DEFINITION
var CelestialGlobe= function(spec, onComplete) {
  //spec is options sent to constructor
  spec.lat = spec.lat||40.6816778, //NYC
  spec.lon = spec.lon||-73.9962808, //NYC
  spec.timestamp = spec.timestamp||new Date();

  // spec.arcPoints = spec.arcPoints||{};
  spec.moonArc = spec.moonArc||[];
  spec.sunArc = spec.sunArc||[];
  spec.analemma = spec.analemma||[];

  spec.position = spec.position||{}; // sun and moon right now
  console.log(spec.timestamp.toString());

  //set positions and arcs
  var getPos = function(callback) {
    $.getJSON("sunmoon/position", {
    lat: spec.lat,
    lon:spec.lon,
    timestamp: spec.timestamp},
    function(newPos) {
      spec.position = newPos
      console.log("updated position");

      callback(newPos);
    })
  }
  var getArcs = function(callback) {
    $.getJSON("sunmoon/day", {
      lat: spec.lat,
      lon:spec.lon,
      timestamp: spec.timestamp},
      function(data) {
        spec.moonArc = data.map(function(item) {
          return item.moon
        })
        spec.sunArc = data.map(function(item){
          return item.sun
        })

        console.log("updated arcs");
        console.log(spec.sunArc);

        callback(spec.position);
    })
  }



  //set sunarc to same day of every month
  var getAnalemma = function(callback) {

    //get a point for each day at the same time.
    $.getJSON("sunmoon/analemma", {
      lat: spec.lat,
      lon:spec.lon,
      timestamp: spec.timestamp},
      function(newArc) {
        spec.analemma = newArc
        console.log("spec.analemma");
        console.log(spec.analemma);

        callback(spec.position)
      }
    )
  }

  //initialize
  getArcs(function(newPos) {
    getAnalemma(function(newPos) {
      getPos(function(newPos) {
        onComplete(newPos)
      })
    })
  });

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
  var xySide = function(pos, canvas, dAz) {
    var x = ((pos.azimuth+dAz) / 2 / Math.PI +0.5 )%1*canvas.width;
    var y = canvas.height - (Math.sin(pos.altitude) * canvas.height);

    return {
      x: x,
      y: y
    };
  }
  //draw polar coords as seen from above
  var xyTop = function(pos, canvas, dAz) {
    dAz += Math.PI/2;  //correct for diff in 0º between the canvas and compass

    var r1 = Math.cos(pos.altitude) * canvas.width/2
    var x = r1 * Math.cos(pos.azimuth+dAz) + canvas.width/2
    var y = r1 * Math.sin(pos.azimuth+dAz) + canvas.height/2

    return {
      x: x,
      y: y
    };
  }

  var halfGlobe = function(pos, canvas, dAz) {
    var r1 = -canvas.height
    var x = r1 * Math.cos(pos.altitude) * Math.cos(pos.azimuth+dAz+Math.PI/2) + canvas.width/2
    var y = r1 * Math.sin(pos.altitude) + canvas.height

    return {
      x: x,
      y: y
    };
  }

  //DRAWING PRIMITIVES
  var drawDisc = function(func, sun, color, ctx, dAz, r) {
    var p = func(sun, ctx.canvas, dAz)
    var r =r|| ctx.canvas.height/10

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  var drawMoon = function(func, moon, src, ctx, dAz) {
    console.log("moon");
    console.log(moon);
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    var p = func(moon, ctx.canvas, dAz)
    var r = c.height/10
    var apparentAngle  = -moon.angle +moon.parallacticAngle + Math.PI/2;

    var img = document.createElement('IMG');
    //draw image after loading
    img.onload = function () {
      //assume spritesheet is made up of squares
      //h/w should be # of sprites
      var sprites = parseInt(img.naturalWidth / img.naturalHeight);
      var spriteOffset = Math.ceil(moon.phase*sprites)%sprites-1
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
    // console.log(points);
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;
    console.log("points:");
    console.log(points);

    ctx.save();
    ctx.beginPath();
    points.reduce(function(p1, p2, i, array) {
      if (p1!== null && i>0) {
        var xy1 = func(p1, c, dAz)
        ctx.moveTo(xy1.x,xy1.y);
        var xy2 = func(p2, c, dAz)
        ctx.lineTo(xy2.x,xy2.y);
      }

      return p2;
    }, {} );
    ctx.stroke();

    ctx.closePath();
    ctx.restore();
  }

  that.customArc = function(func) {
    func(spec.sunArc)
  }


  //VIEW Functions
  that.sideView = function(ctx, dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    ctx.clearRect(0,0,c.width, c.height)

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

    labels.map(function(item, index, array){
      var p = xySide(item, ctx.canvas, dAz )
      ctx.fillText(item.label, p.x, c.height)
    })
    console.log("spec.arcPoints:");
    console.log(spec.arcPoints);
    //draw paths above horizon
    drawArc(xySide, spec.analemma, ctx, dAz);

    drawArc(xySide, spec.sunArc, ctx, dAz);
    drawArc(xySide, spec.moonArc, ctx, dAz);

    //draw sun and moon
    console.log("spec.position:");
    console.log(spec.position);
    drawMoon(xySide, spec.position.moon, "img/phases-sheet.png", ctx, dAz)
    drawDisc(xySide, spec.position.sun, "#fdb813", ctx, dAz);
    ctx.restore()
  }

  that.globeView = function(ctx, dAz) {
    var hideFrontHalf = function(item) {
      console.log(item.azimuth);
      var angle = item.azimuth+dAz
      return angle > -Math.PI/2 && angle < Math.PI/2
    }

    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;

    ctx.clearRect(0,0,c.width, c.height)

    // ctx.save();

    var y = Math.PI/2;

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
    // ctx.closePath()

    //filter out points that are "in front" of the screen 90º-270º
    // var sunArc = spec.sunArc.filter(hideFrontHalf)
    // var moonArc = spec.moonArc.filter(hideFrontHalf)
    // drawArc(halfGlobe, sunArc, ctx, dAz);
    // drawArc(halfGlobe, moonArc, ctx, dAz);
    drawArc(halfGlobe, spec.sunArc, ctx, dAz);
    drawArc(halfGlobe, spec.moonArc, ctx, dAz);
    // drawArc(halfGlobe, spec.analemma, ctx, dAz);

    spec.analemma.map(function(item){
      drawDisc(halfGlobe, item, "#fff", ctx, dAz, 5)
    })

    drawMoon(halfGlobe, spec.position.moon, "img/phases-sheet.png", ctx, dAz)
    drawDisc(halfGlobe, spec.position.sun, "#fdb813", ctx, dAz);

    //mask out everything outside the globe
    ctx.save()
    ctx.globalCompositeOperation = 'destination-in'
    ctx.beginPath();
    ctx.arc(c.width/2,c.height,c.width/2,0,2*Math.PI);
    // ctx.closePath()
    ctx.fill()
    ctx.restore();


  }

  that.topView = function(ctx, /*arcPoints, position,*/ dAz) {
    var c={}
    c.width = ctx.canvas.width;
    c.height = ctx.canvas.height;
    ctx.clearRect(0,0,c.width, c.height)

    ctx.fillStyle="#ccc"

    //draw top view
    ctx.beginPath();
    ctx.arc(c.width/2, c.height/2, c.width/2,0,2*Math.PI);
    ctx.stroke();


    drawArc(xyTop, spec.sunArc, ctx, dAz);
    drawArc(xyTop, spec.moonArc, ctx, dAz);
    drawArc(xyTop, spec.analemma, ctx, dAz);

    drawShadow(spec.position.sun,"img/shadow.png", ctx, topCanvas[0], dAz)

    drawMoon(xyTop, spec.position.moon, "img/phases-sheet.png", ctx, dAz)
    drawDisc(xyTop, spec.position.sun, "#fdb813", ctx, dAz);
  }

  that.getPartOfDay = function() {
    return spec.position.partOfDay;
  }

  //UPDATE FUNCTIONS
  that.updateDay = function(timestamp, callback) {
    var newDate = new Date(timestamp);

    if (newDate.toDateString() !== spec.timestamp.toDateString()) {
      spec.timestamp = new Date(timestamp);

      // getArcs(function() {
      //   getPos(callback)
      //   getAnalemma(callback)
      // })

      getArcs(function(newPos) {
        getAnalemma(function(newPos) {
          getPos(function(newPos) {
            callback(newPos)
          })
        })
      })

    }
  }

  that.updateTime = function(hours, minutes, callback) {
    spec.timestamp.setHours(hours, minutes)

    // getPos(callback)
    // getAnalemma(callback)
    var newPos = spec.position
      getAnalemma(function(newPos) {
        getPos(function(newPos) {
          callback(newPos)
        })
      })

  }

  that.getTime = function() {
    return spec.timestamp.toString();
  }

  return that;
}
