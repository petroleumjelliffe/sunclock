var express = require('express');
var sunCalc = require('suncalc');
var Util = require('util');

var router = express.Router();
//routes
// /sunmoon/now
// / sunmoon/positions

 var timeOfDay = sunCalc.times.sort(function(a,b) { return (a[0]>b[0])} );

var spitOutPos = function(now, times, sorted, lat, lon) {
  // var nowPos = {}
  var sunPos = sunCalc.getPosition(now, lat, lon);
  var moonPos = sunCalc.getMoonPosition(now, lat, lon);
  var moonPhase = sunCalc.getMoonIllumination(now);
  moonPos.phase = moonPhase.phase;
  moonPos.angle = moonPhase.angle;
  moonPos.fraction = moonPhase.fraction;

  var partOfDay = sorted.reduce(function(min, cur, i, array) {
    console.log(now.toISOString() +"<"+ times[cur].toISOString());
    console.log(now.toISOString() < times[cur].toISOString() ? min : cur);
    return (now.toISOString() < times[cur].toISOString()) ? min : cur
  }, sorted[sorted.length-1]);


  return {
    timestamp: new Date(now),
    sun:sunPos,
    moon: moonPos,
    // moonPhase: moonPhase,
    partOfDay: partOfDay
  }
}

router.get('/position', function(req, res, next) {
  var now = (req.query.timestamp) ? new Date(req.query.timestamp) : new Date()
  console.log(now);
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  var times = sunCalc.getTimes(now, lat, lon);
  var sorted = Object.keys(times).sort(function(a,b) {
    console.log(times[a]>times[b]);
    return times[a] - times[b]
  })

  res.json(spitOutPos(now, times, sorted, lat, lon));

})

var increment = function(date) {
  return new Date(date.getTime()+15*60*1000)

}

router.get('/day', function(req, res, next) {
  var today = (req.query.timestamp) ? new Date(req.query.timestamp) : new Date()
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  console.log(today.toString());

  //set to midnight
  today.setHours(0,0,0,0)

  var now = today;
  var end = new Date(today);
  end.setHours(24,0,0,0)

  var positions = [];

  var times = sunCalc.getTimes(today, lat, lon);
  var sorted = Object.keys(times).sort(function(a,b) {
    console.log(times[a]>times[b]);
    return times[a] - times[b]
  })

  console.log(now.getTime());
  console.log(end.getTime());

  while (now.getTime() < end.getTime()) {
    positions.push(spitOutPos(now, times, sorted, lat, lon))
    now = increment(now)
  }

  res.json(positions)

})

router.get('/analemma', function(req, res, next) {
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC
  var now = (req.query.timestamp) ? new Date(req.query.timestamp) : new Date()

  var arc = []
  for (var i=0; i<13; i++) {
    var date = new Date(now.getFullYear(),now.getMonth+i, now.getDay(),17,0,0)
    arc.push(sunCalc.getPosition(date, lat, lon))

  }
  res.json(arc)
})



// respond with "hello world" when a GET request is made to the homepage
router.get('/now', function(req, res, next) {
  // var now = new Date()
  var now = (req.query.timestamp) ? new Date(req.query.timestamp) : new Date()
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  var nowPos = {}
  nowPos.sun = sunCalc.getPosition(now, lat, lon);
  nowPos.moon = sunCalc.getMoonPosition(now, lat, lon);
  nowPos.moonPhase = sunCalc.getMoonIllumination(now);

  // get current part of the day (sunrise, sunset, night, etc.)
  var timeOfDay = sunCalc.times.sort(function(a,b) { return (a[0]>b[0])} )
  console.log(sunCalc.times)
  console.log(nowPos.sun.altitude*180/Math.PI);

  nowPos.partOfDay = timeOfDay.reduce(function(prev, cur, i, array) {
    var ascending = (sunCalc.getTimes(now, lat, lon).solarNoon.getTime() > now.getTime()) ? 1 : 2
    return ( nowPos.sun.altitude > (cur[0]*Math.PI/180) ? cur[ascending] : prev)
  }, "night")
  res.json(nowPos);
  // res.json(spitOutPos(now, lat, lon));

  next();
})

function listTimes(interval, rise, set) {
  var deltaT = interval * 60 * 1000;

  //how many n minute intervals of light are there?
  var lightIntervals = Math.abs((set.getTime() - rise.getTime()) / (deltaT));

  var times=[];

  for (var i=0; i < lightIntervals; i++) {
    var dateTime = new Date(rise.getTime() + (i * deltaT))
    times.push(dateTime)
  }

  return times;
}

var generate = function(array, cur, max) {
  array.push(cur)

  if (cur > max) {
    return array
  } else {
    generate(array, cur+1, max)

  }

}




//get a day's worth of positions for sun and moon
router.get('/positions', function(req, res, next) {
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC
  var now = (req.query.timestamp) ? new Date(req.query.timestamp) : new Date()



  // var now = new Date()
  // now.setHours(req.query.hours%24, req.query.hours)
  var today = now;
  today.setHours(0,0,0,0);
  var tomorrow = now;
  tomorrow.setHours(23,45);
  // console.log(today);
  // console.log(tomorrow);
  function plotArc(fnPos, dateArray) {
    // console.log(dateArray)

    return dateArray.map(function(date, index, array) {
      // console.log(date)
      return fnPos(date, lat, lon)
    })

  }

  var sunTimes = sunCalc.getTimes(now, lat, lon);
  var moonTimes = sunCalc.getMoonTimes(now, lat, lon);

  var allDayTimes = listTimes(15, today, tomorrow)


  console.log(allDayTimes);

  var arcs = {}
  arcs.sun = plotArc(sunCalc.getPosition, allDayTimes)
  arcs.moon = plotArc(sunCalc.getMoonPosition, allDayTimes)

  res.json(arcs);

  next();
});




router.get('/weekly', function(req, res) {
  //console.log(req);

  function listTimes(interval, rise, set) {
    var deltaT = interval * 60 * 1000;

    //how many n minute intervals of light are there?
    var lightIntervals = (set.getTime() - rise.getTime()) / (deltaT);

    var times=[];

    for (var i=0; i < lightIntervals; i++) {
      var dateTime = new Date(rise.getTime() + (i * deltaT))
      times.push(dateTime)



    }

    return times;
  }

  //replace times with positions at those times
  function plotArc(fnPos, dateArray) {
    console.log(dateArray)

    return dateArray.map(function(date, index, array) {
      console.log(date)
      return fnPos(date, lat, lon)
    })

  }

  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC
  var now = new Date()

  // var sunTimes = sunCalc.getTimes(now, lat, lon);
  // var moonTimes = sunCalc.getMoonTimes(now, lat, lon);
  //
  //
  // var daylightTimes = listTimes(15, sunTimes.sunrise, sunTimes.sunset) //array of times to get positions for
  //
  // var moonlightTimes = []; //empty array of moon points

  // if (!moonTimes.alwaysDown) {
  //   if(!moonTimes.alwaysUp) {
  //     moonlightTimes = listTimes(15, moonTimes.rise, moonTimes.set);
  //   } else {
  //     //if moon doesn't set get all 24 hours worth
  //     moonlightTimes = listTimes(15, now, new Date(now.getTime() + (24 * 60 * 60 * 1000)));
  //   }
  // }

  var times = listTimes(30,
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    new Date(now.getFullYear(), now.getMonth(), now.getDate()+7))
console.log(times);


  var arcs = {}
  arcs.sun = plotArc(sunCalc.getPosition, times)
  arcs.moon = plotArc(sunCalc.getMoonPosition, times)

  res.json(arcs);
});

// respond with "hello world" when a GET request is made to the homepage
router.get('/sun', function(req, res) {
  console.log(req);

  if (req.query !== null) {
    console.log(req.query);
  }

  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  // get today's sunlight times for London
  var times = sunCalc.getTimes(new Date(), lat, lon);

  var pos = new Array();
  console.log(times);
  for (var time in times) {

    console.log(times[time])
    var radPos = sunCalc.getPosition(times[time], lat, lon);
    var degPos = {}
    degPos.altitude = radPos.altitude * 180 / Math.PI;
    degPos.azimuth = radPos.azimuth * 180 / Math.PI;

    // pos.push(sunCalc.getPosition(times[time], lat, lon));
    pos.push(degPos);
  }

  //where's the sun now?
  var now = new Date();


  // format sunrise time from the Date object
  var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();

  // get position of the sun (azimuth and altitude) at today's sunrise
  var sunrisePos = sunCalc.getPosition(now, lat, lon);

  // get sunrise azimuth in degrees
  var sunriseAzimuth = sunrisePos.azimuth * 180 / Math.PI;
  console.log(now);
  console.log("now"+sunriseAzimuth)
  var response = sunriseAzimuth
  res.json(pos);
});

module.exports = router;
