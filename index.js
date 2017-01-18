var express = require('express');
var path = require('path');
var dotenv = require('dotenv').load();

// var sunCalc = require('suncalc');
// var Forecast = require('forecast.io');
var Util = require('util');

var weatherRouter = require('./routes/weather');
var sunmoonRouter = require('./routes/sunmoon');
var clockRouter = require('./routes/clock');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


//serve static files from /public
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));

//routes
app.use('/weather', weatherRouter);
app.use('/sunmoon', sunmoonRouter);
app.use('/clock', clockRouter);

app.listen(process.env.PORT || 5000);
