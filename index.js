/*jslint node: true */ /*global define */
'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var dvb = require('dvbjs');
var moment = require('moment');
var dvbHelper = require('./dvbHelper.js');
var app = new Alexa.app('fahrplan-dresden');
var dvbHelperInstance = new dvbHelper();
var cardArray = [];

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
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} um {-|TIME}']
},
  function(req, res) {
    //get the slot
    var timeSlot = req.slot('TIME'); // starting at what time
    var time = dvbHelperInstance.getTime(timeSlot);
    var startStation = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var reprompt = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';

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
                res.say(prompt).shouldEndSession(false);
                return;
            }

            var tripsLength = tripsArray.trips.length;
            var resultObject = [];

            for (var i = 0; i < tripsLength; i++) {
                var trips = dvbHelperInstance.getTrips(tripsArray, i);

                if (trips.length === 1) {
                    resultObject = dvbHelperInstance.connectionSingleTrip(res, trips);
                    if (resultObject !== undefined) {
                        var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation, resultObject[1]);
                        dvbHelperInstance.cardCreator(res, cardContent);
                        res.say(resultObject[0]).send();
                        console.log(resultObject[0]);
                    }
                } else {
                    dvbHelperInstance.resetCardArray();
                    for (var s = 0; s < trips.length; s++) {
                        resultObject = dvbHelperInstance.connectionMultipleTrips(res, s, trips);
                        if (resultObject !== undefined) {
                            res.say(resultObject[0]).send();
                            console.log(resultObject[0]);
                        }
                    }
                    var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation,resultObject[1]);
                    dvbHelperInstance.cardCreator(res, cardContent);
                    return;
                }


            }

            res.say("Das war es.").shouldEndSession(true);

        });
      return false;
    }
 }
);

app.intent('VerbindungsauskunftMinuten', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS',
    'MINUTES': 'AMAZON.NUMBER'
  },
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} in {-|MINUTES} Minuten']
},
  function(req, res) {
    //get the slot
    var timeSlot = req.slot('MINUTES'); // starting at what time
    var duration = dvbHelperInstance.getDuration(timeSlot);
    var startStation = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var reprompt = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation) || _.isEmpty(timeSlot)) {
      var prompt = 'Ich habe habe nicht alles verstanden. Versuche es nochmal.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        console.log('Datestring: ' + duration);

        dvb.route(startStation, destinationStation, duration, deparr, function(err, data) {
            if (err) throw err;
            var result = JSON.stringify(data, null, 4);
            console.log(result);
            var tripsArray = JSON.parse(result);

            if (tripsArray === null) {
                prompt = 'Ich kann keine Ergebnisse für diese Fahrt finden.';
                res.say(prompt).shouldEndSession(false);
                return;
            }

            var tripsLength = tripsArray.trips.length;
            var resultObject = [];

            for (var i = 0; i < tripsLength; i++) {
                var trips = dvbHelperInstance.getTrips(tripsArray, i);

                if (trips.length === 1) {
                    resultObject = dvbHelperInstance.connectionSingleTrip(res, trips);
                    if (resultObject !== undefined) {
                        var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation, resultObject[1]);
                        dvbHelperInstance.cardCreator(res, cardContent);
                        res.say(resultObject[0]).send();
                        console.log(resultObject[0]);
                    }
                } else {
                    dvbHelperInstance.resetCardArray();
                    for (var s = 0; s < trips.length; s++) {
                        resultObject = dvbHelperInstance.connectionMultipleTrips(res, s, trips);
                        if (resultObject !== undefined) {
                            res.say(resultObject[0]).send();
                            console.log(resultObject[0]);
                        }
                    }
                    var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation,resultObject[1]);
                    dvbHelperInstance.cardCreator(res, cardContent);
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
    'RESULTS': 'AMAZON.NUMBER',
    'OFFSET': 'AMAZON.TIME'
  },
  'utterances': ['{|Die} {-|RESULTS} {|nächsten} {|Fahrten} {|von} {-|STATION}']
},
  function(req, res) {
    //get the slot
    var stationCode = req.slot('STATION');
    var numResults = req.slot('RESULTS');
    var timeOffset = req.slot('OFFSET');
    var reprompt = 'Sage mir eine Haltestelle.';
    var result;

    //stationcode = dvbHelperInstance.stringReplacer(stationCode);

    if (_.isEmpty(numResults)) {
        numResults = 3;
    }

    if (_.isEmpty(timeOffset)) {
        timeOffset = 0;
    }

    if (_.isEmpty(stationCode)) {
      var prompt = 'Ich habe die Haltestelle nicht verstanden. Versuche es nochmal.';
      res.say(prompt).shouldEndSession(false);
      return true;
    } else {
        dvb.monitor(stationCode, timeOffset, numResults, function(err, data) {
            if (err) throw err;

            var resultObject = dvbHelperInstance.getStationInfo(res, data);
            var result = resultObject[0];
            var cardResult = resultObject[1];
            var resultText = '';
            var cardText = '';

            if (result !== undefined) {
                for (var i = 0; i < result.length; i++) {
                    resultText = resultText + result[i];
                }

                for (var i = 0; i < cardResult.length; i++) {
                    cardText = cardText + cardResult[i];
                }

                console.log(cardText);
                res.say(resultText).send();
                var cardContent = dvbHelperInstance.cardObjectHelper('Abfahrten ' + ' → ' + stationCode ,cardText);
                dvbHelperInstance.cardCreator(res, cardContent);
            }

        });

      return false;
    }
  }
);


app.error = function(exception, request, response) {
    response.say("Sorry, da ist etwas schief gelaufen");
};

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
