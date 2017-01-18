var express = require('express');
var qs = require('qs');
var request = require('request');
var router = express.Router();



router.get('/bustime', function(req, res, next) {
  //get details about station ID from bustime API

  var url= "http://bustime.mta.info/api/siri/stop-monitoring.json"
  options = {
    key: process.env.API_KEY_BUSTIME,
    OperatorRef:"MTA",
    MonitoringRef:req.query.stopId||305361,
    LineRef:req.query.lineRef||"MTA NYCT_B63"
  }

  var query = qs.stringify(options)
  // console.log(process.env.API_KEY_BUSTIME);
  console.log(options);
  console.log(url+"?"+query);
  request.get(url+"?"+query, function(error, response, data) {
    if (!error && response.statusCode == 200) {
      console.log(data) // Show the HTML for the Google homepage.

      //reformat bustime JSON object
      var json = JSON.parse(data)

      var buses= json.Siri.ServiceDelivery.StopMonitoringDelivery[0].MonitoredStopVisit

      var arrivals = buses.map(function(bus, index, array) {
        var obj = {}
        obj.distances = bus.MonitoredVehicleJourney.MonitoredCall.Extensions.Distances
        obj.arrivalTime = bus.MonitoredVehicleJourney.MonitoredCall.ExpectedArrivalTime

        return obj;
      })

      res.json(arrivals)

    } else {
      // res.json(stops)
      res.send("hello world");

    }
  })
  // next()
});


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'B63' });

  // next();
});

module.exports = router;
