var express = require('express');
// var sunCalc = require('suncalc');
// var Forecast = require('forecast.io');
var Util = require('util');

var weatherRouter = require('./routes/weather');
var sunmoonRouter = require('./routes/sunmoon');


var app = express();

//serve static files from /public
app.use(express.static('public'));

//routes
app.use('/weather', weatherRouter);
app.use('/sunmoon', sunmoonRouter);

app.listen(process.env.PORT || 5000);
