'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var dvb = require('dvbjs');
var moment = require('moment');
var dvbHelper = require('./dvbHelper.js');
var app = new Alexa.app('fahrplan-dresden');
var dvbHelperInstance = new dvbHelper();

app.launch(function(req, res) {
  var prompt = 'Was kann ich für dich tun?';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('Verbindungsauskunft', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS',
    'TIME': 'AMAZON.TIME'
  },
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} {|um} {-|TIME}']
},
  function(req, res) {
    //get the slot
    var startStation = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var timeSlot = req.slot('TIME'); // starting at what time
    var reprompt = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    var time = dvbHelperInstance.getTime(timeSlot);

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation)) {
      var prompt = 'Ich habe habe eine der Haltestellen nicht verstanden.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.route(startStation, destinationStation, time, deparr, function(err, data) {
            if (err) throw err;
            var result = JSON.stringify(data, null, 4);
            var tripsArray = JSON.parse(result);

            if (tripsArray === null) {
                prompt = 'Ich kann keine Ergebnisse für diese Fahrt finden.';
                res.say(prompt).shouldEndSession(true);
                return;
            }

            var tripsLength = tripsArray.trips.length;

            for (var i = 0; i < tripsLength; i++) {
                var trips = dvbHelperInstance.getTrips(tripsArray, i);

                if (trips.length === 1) {
                    connectionSingleTrip(res, trips);
                } else {
                    for (var s = 0; s < trips.length; s++) {
                        connectionMultipleTrips(res, s, trips);
                    }
                    return;
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
    'OFFSET': 'AMAZON.TIME'
  },
  'utterances': ['{|Die} {-|RESULTS} {|nächsten} {|Fahrten} von {-|STATION}']
},
  function(req, res) {
    //get the slot
    var stationCode = req.slot('STATION');
    var numResults = req.slot('RESULTS');
    var timeOffset = req.slot('OFFSET');
    var reprompt = 'Sage mir eine Haltestelle.';

    //stationcode = dvbHelperInstance.stringReplacer(stationCode);

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
            getStationInfo(res, data);
        });

      return false;
    }
  }
);

function connectionSingleTrip(res, trips) {
    var result;
    var mode = trips[0].mode;
    var line = trips[0].line;
    var direction = trips[0].direction;
    var direction = direction.replace(/"/g, '');
    var departure = trips[0].departure.stop;
    var departureTime = trips[0].departure.time;
    var arrival = trips[0].arrival.stop;
    var arrivalTime = trips[0].arrival.time;
    if (mode === "Fussweg") {
        return;
    } else {
        console.log("Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr.");
        result = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr.";
        res.say(result).send();
    }
}

function connectionMultipleTrips(res, s, trips) {
    var result;
    var mode = trips[s].mode;
    var line = trips[s].line;
    var direction = trips[s].direction;
    var direction = direction.replace(/"/g, '');
    var departure = trips[s].departure.stop;
    var departureTime = trips[s].departure.time;
    var arrival = trips[s].arrival.stop;
    var arrivalTime = trips[s].arrival.time;

    if (s === 0) {
        console.log(trips[s].departure.stop, trips[s].arrival.stop, "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTime + " Uhr.");
        result = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTime + " Uhr.";
    } else {
        console.log(trips[s].departure.stop, trips[s].arrival.stop, "Danach "+ departureTime + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + " ist die Ankunft am Ziel " + arrival + ' um ' + arrivalTime + " Uhr.");
        result = "Danach "+ departureTime + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + ". Die Ankunft am Ziel " + arrival + ' ist um ' + arrivalTime + " Uhr.";
    }

    res.say(result).send();
}

function getStationInfo(res, data) {
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
}

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
