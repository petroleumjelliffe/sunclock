var express = require('express');
var Forecast = require('forecast.io');
var Util = require('util');

var router = express.Router();

router.use(function(req, res) {
  var key = req.query.forecast_key || process.env.FORECAST_API_KEY
  var lat = req.query.lat || 40.6816778; //NYC
  var lon = req.query.lon || -73.9962808; //NYC
  console.log(key);

  var options = {
    "APIKey": key
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

    var tempNow = data.currently.temperature;
    console.log(data.currently.temperature);
    //get max and min of temps for the week
    var tempMax = data.daily.data.reduce(function(prev, cur){
      console.log("max temp" +cur.temperatureMax);

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

    var temperatureArray = [tempNow, tempMax.temperatureMax, tempMin.temperatureMin];
    for (var i=0; i< data.daily.data.length; i++) {

      temperatureArray.push(data.daily.data[i].temperatureMax)
      temperatureArray.push(data.daily.data[i].temperatureMin)
    }

    that.json(temperatureArray);

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

module.exports = router;
