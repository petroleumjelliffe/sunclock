var express = require('express');
var sunCalc = require('suncalc');
var Forecast = require('forecast.io');
var Util = require('util');
var app = express();

//serve static files from /public
app.use(express.static('public'));

// respond with "hello world" when a GET request is made to the homepage
app.get('/now', function(req, res) {
  var now = new Date()
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  var nowPos = {}
  nowPos.sun = sunCalc.getPosition(now, lat, lon);
  nowPos.moon = sunCalc.getMoonPosition(now, lat, lon);
  nowPos.moonPhase = sunCalc.getMoonIllumination(now);

  //get current part of the day (sunrise, sunset, night, etc.)
  var timeOfDay = sunCalc.times.sort(function(a,b) { return (a[0]>b[0])} )
  console.log(sunCalc.times)
  console.log(nowPos.sun.altitude*180/Math.PI);
  // var x = timeOfDay.reduce(function(prev, cur, i, array) {
  //   var ascending = (sunCalc.getTimes(now, lat, lon).solarNoon.getTime() > now.getTime()) ? 1 : 2
  //   return ( nowPos.sun.altitude > (cur[0]*Math.PI/180) ? cur[ascending] : prev)
  // }, "night")
  // console.log(x);
  nowPos.partOfDay = timeOfDay.reduce(function(prev, cur, i, array) {
    var ascending = (sunCalc.getTimes(now, lat, lon).solarNoon.getTime() > now.getTime()) ? 1 : 2
    return ( nowPos.sun.altitude > (cur[0]*Math.PI/180) ? cur[ascending] : prev)
  }, "night")
  res.json(nowPos);
})

// respond with "hello world" when a GET request is made to the homepage
app.get('/sunmoon', function(req, res) {
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

  var sunTimes = sunCalc.getTimes(now, lat, lon);
  var moonTimes = sunCalc.getMoonTimes(now, lat, lon);


  var daylightTimes = listTimes(15, sunTimes.sunrise, sunTimes.sunset) //array of times to get positions for

  var moonlightTimes = []; //empty array of moon points

  if (!moonTimes.alwaysDown) {
    if(!moonTimes.alwaysUp) {
      moonlightTimes = listTimes(15, moonTimes.rise, moonTimes.set);
    } else {
      //if moon doesn't set get all 24 hours worth
      moonlightTimes = listTimes(15, now, new Date(now.getTime() + (24 * 60 * 60 * 1000)));
    }
  }


  var arcs = {}
  arcs.sun = plotArc(sunCalc.getPosition, daylightTimes)
  arcs.moon = plotArc(sunCalc.getMoonPosition, moonlightTimes)

  res.json(arcs);
});


app.get('/weekly', function(req, res) {
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
app.get('/sun', function(req, res) {
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

app.get('/weather', function(req, res) {
  var key = req.query.forecast_key || process.env.FORECAST_API_KEY
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC

  var options = {
    APIKey: process.env.FORECAST_API_KEY
  }
  var forecast = new Forecast(options);

  var that= res;
  forecast.get(lat, lon, function (err, res, data) {
    if (err) throw err;
    console.log('res: ' + Util.inspect(res));
    console.log('data: ' + Util.inspect(data));
    console.log('that: ' + Util.inspect(that));

    var offset = data.offset * 60 * 60; //seconds
    var today = new Date((data.daily.data[1].time ) * 1000);

    //get max and min of temps for the week
    var tempMax = data.daily.data.reduce(function(prev, cur){
      console.log(cur.temperatureMax);

      if (prev.temperatureMax < cur.temperatureMax) {
        return cur
      }
      return prev
    });

    var tempMin = data.daily.data.reduce(function(prev, cur){
      if (prev.temperatureMin > cur.temperatureMin) {
        return cur
      }
      return prev
    });
    that.json(data);

    var scale = (168.0 / 3.0) / (tempMax.temperatureMax - tempMin.temperatureMin); //pebble height top third


    console.log('scale' + scale);
    console.log(tempMax.temperatureMax + ', ' + tempMin.temperatureMin);
    data.daily.data.map(function(cur, i){
      console.log('GRect rect_bounds' + i + ' = GRect(' + ((i+1)*16) + ', '+ ((tempMax.temperatureMax - cur.temperatureMax)*scale) +', 14, ' + ((cur.temperatureMax - cur.temperatureMin)*scale) + ');')

    });

    var roundTemp = Math.ceil(tempMin.temperatureMin/10)*10;
    for (var i = roundTemp; i < tempMax.temperatureMax; i += 10) {
      var dy = (tempMax.temperatureMax - i) * scale;
      console.log('GPoint start'+i+' = GPoint(0, ' + dy + ');' );
      console.log('GPoint end'+i+' = GPoint(144, ' + dy + ');' );
    }


    console.log('GPoint startNow = GPoint(0, '+((tempMax.temperatureMax - data.currently.temperature)* scale)+');');
    console.log('GPoint endNow = GPoint(20, '+((tempMax.temperatureMax - data.currently.temperature)* scale)+');');
    console.log('char *text = "'+data.currently.temperature+String.fromCharCode(parseInt("00B0", 16))+'";');

  });
});

app.listen(process.env.PORT || 5000);
