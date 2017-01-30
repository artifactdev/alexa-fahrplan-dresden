'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var dvb = require('dvbjs');
var moment = require('moment');
var app = new Alexa.app('fahrplan-dresden');

app.launch(function(req, res) {
  var prompt = 'Verbindungsauskunft & Abfahrtsmonitor.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('Verbindungsauskunft', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS',
    'TIME': 'AMAZON.time'
  },
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} {|um} {-|TIME}']
},
  function(req, res) {
    //get the slot

    var startStation = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var timeSlot = req.slot('TIME'); // starting at what time
    var reprompt = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    var time;

    time = new Date();
    if (!_.isEmpty(time)) {
        console.log("aktuelle zeit")
    } else {
        console.log(timeSlot);
        //time = new Date();
        //time.setTime(timeSlot);
    }

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation)) {
      var prompt = 'Ich habe habe eine der Haltestellen nicht verstanden.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.route(startStation, destinationStation, time, deparr, function(err, data) {
            if (err) throw err;
            //console.log(JSON.stringify(data, null, 4));
            var result = JSON.stringify(data, null, 4);
            var tripsArray = JSON.parse(result);
            var tripsLength = tripsArray.trips.length;
            //console.log(data);
            for (var i = 0; i < tripsLength; i++) {
                var trips = getTrips(tripsArray, i);
                var mode = trips.mode;
                var line = trips.line;
                var direction = trips.direction;
                direction = direction.replace(/"/g, '');
                var departure = trips.departure.stop;
                var departureTime = trips.departure.time;
                var arrival = trips.arrival.stop;
                var arrivalTime = trips.arrival.time;
                if (mode === "Fussweg") {
                    return;
                } else {
                    //console.log(mode, line, departure, departureTime,arrival, arrivalTime);
                    console.log("Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr." );
                    var result = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr.";
                    res.say(result).send();
                }
            }

            res.say("Das war es.").shouldEndSession(true);

        });
      return false;
    }
 }
);

app.intent('Abfahrtsmonitor', {
  'slots': {
    'STATION': 'STATIONS',
    'RESULTS': 'RESULTCOUNT',
    'OFFSET': 'OFFSETMINUTES'
  },
  'utterances': ['{|Die} {-|RESULTS} {|nächsten} {|Fahrten} von {-|STATION}']
},
  function(req, res) {
    //get the slot
    var stationCode = req.slot('STATION');
    var numResults = req.slot('RESULTS');
    var timeOffset = req.slot('OFFSET');
    var reprompt = 'Sage mir eine Haltestelle.';

    stationCode = stationCode.toString();
    stationCode = stationCode.toLowerCase();
    stationCode = stationCode.replace(/ä/g, 'ae');
    stationCode = stationCode.replace(/ö/g, 'oe');
    stationCode = stationCode.replace(/ü/g, 'ue');
    stationCode = stationCode.replace(/ß/g, 'ss');
    stationCode = stationCode.replace(/ /g, '-');
    stationCode = stationCode.replace(/\./g, '');
    stationCode = stationCode.replace(/,/g, '');
    stationCode = stationCode.replace(/\(/g, '');
    stationCode = stationCode.replace(/\)/g, '');
    stationCode = stationCode.replace(/ /g, '');


    if (_.isEmpty(numResults)) {
        numResults = 3;
    }

    if (_.isEmpty(timeOffset)) {
        timeOffset = 0;
    }

    if (_.isEmpty(stationCode)) {
      var prompt = 'Ich habe die Haltestelle nicht verstanden. Sag mir eine Haltestelle.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        dvb.monitor(stationCode, timeOffset, numResults, function(err, data) {
            if (err) throw err;
            //console.log(JSON.stringify(data, null, 4));
            var zeit;
            var result;
            var length = data.length;
            for (var i = 0; i < length; i++) {
                zeit = moment(data[i].arrivalTime, "x").locale("de").fromNow();

                if (length <= 0 ||(i + 1) === length) {

                    //console.log( 'Linie ' + data[i].line + ' nach ' + data[i].direction + ' ' + zeit );

                    result =  'Linie ' + data[i].line + ' nach ' + data[i].direction + ' ' + zeit;
                } else {

                    //console.log( 'Linie ' + data[i].line + ' nach ' + data[i].direction + ' ' + zeit + ' und');

                    result =  'Linie ' + data[i].line + ' nach ' + data[i].direction + ' ' + zeit + ' und';
                }
                res.say(result).send();
                console.log(result);
            }
        });

      return false;
    }
  }
);

// Gets all the tripinfos from Array
function getTrips(data, i) {
    var tmp = JSON.stringify(data.trips[i].nodes);
    tmp = JSON.parse(tmp);
    tmp = JSON.stringify(tmp);
    tmp = JSON.parse(tmp);
    return tmp[0];
}

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
