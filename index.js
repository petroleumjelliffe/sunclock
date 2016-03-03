var express = require('express');
var sunCalc = require('suncalc');
var app = express();

// respond with "hello world" when a GET request is made to the homepage
app.get('/sun', function(req, res) {
  console.log(req);
  var lat = 40.6816778
  var lon = -73.9962808
  // get today's sunlight times for London
  var times = sunCalc.getTimes(new Date(), lat, lon);

  var pos = new Array();
  for (var time in times) {
    console.log(times[time])
    pos.push(sunCalc.getPosition(times[time], lat, lon));
  }

  // format sunrise time from the Date object
  var sunriseStr = times.sunrise.getHours() + ':' + times.sunrise.getMinutes();

  // get position of the sun (azimuth and altitude) at today's sunrise
  var sunrisePos = sunCalc.getPosition(times.sunrise, lat, lon);

  // get sunrise azimuth in degrees
  var sunriseAzimuth = sunrisePos.azimuth * 180 / Math.PI;

  var response = sunriseAzimuth
  res.json(pos);
});
app.listen(5000);
