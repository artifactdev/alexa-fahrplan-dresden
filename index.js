/*jslint node: true */ /*global define */
'use strict';
module.change_code    = 1;
var _                 = require('lodash');
var Alexa             = require('alexa-app');
var dvb               = require('dvbjs');
var moment            = require('moment');
var dvbHelper         = require('./dvbHelper.js');
var app               = new Alexa.app('fahrplan-dresden');
var dvbHelperInstance = new dvbHelper();
var cardArray         = [];

app.launch(function(req, res) {
  var prompt = 'Frage nach Abfahrten oder Verbindungen.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('Verbindungsauskunft', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS',
    'TIME': 'AMAZON.TIME'
  },
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} um {-|TIME}', 'nach Verbindung von {-|STARTSTATION} nach {-|DESTINATIONSTATION} um {-|TIME}']
},
  function(req, res) {
    //get the slot
    var timeSlot           = req.slot('TIME'); // starting at what time
    var time               = dvbHelperInstance.getTime(timeSlot);
    var startStation       = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var reprompt           = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    cardArray              = [];

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation)) {
      var prompt = 'Ich habe habe eine der Haltestellen nicht verstanden.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.route(startStation, destinationStation, time, deparr).then( function(data) {
            if (data !== null) {
                var result       = JSON.stringify(data, null, 4);
                var tripsArray   = JSON.parse(result);

                var tripsLength  = tripsArray.trips.length;
                var resultObject = [];


                for (var i = 0; i < tripsLength; i++) {
                    var trips = dvbHelperInstance.getTrips(tripsArray, i);

                    if (trips.length === 1) {
                        resultObject = dvbHelperInstance.connectionSingleTrip(res, trips, time);
                        if (resultObject !== undefined) {
                            res.say(resultObject[0]).send();
                            console.log(JSON.stringify(resultObject));
                            cardArray.push(JSON.stringify(resultObject[1]));
                        }
                    } else {
                        dvbHelperInstance.resetCardArray();
                        for (var s = 0; s < trips.length; s++) {
                            if (dvbHelperInstance.isInFuture(trips[0].departure.time, time)) {
                                resultObject = dvbHelperInstance.connectionMultipleTrips(res, s, trips, time);
                                if (resultObject !== undefined) {
                                    res.say(resultObject[0]).send();
                                    cardArray.push(JSON.stringify(resultObject[1]));
                                }
                            }
                        }
                    }
                }
                var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation,cardArray);
                dvbHelperInstance.cardCreator(res, cardContent);

                res.say("Das war es.").shouldEndSession(true);
            } else {
                prompt = 'Ich kann keine Ergebnisse für diese Verbindung finden.';
                res.say(prompt).send();
            }
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
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} in {-|MINUTES} Minuten', 'nach Verbindung von {-|STARTSTATION} nach {-|DESTINATIONSTATION} in {-|MINUTES} Minuten']
},
  function(req, res) {
    //get the slot
    var timeSlot           = req.slot('MINUTES'); // starting at what time
    var duration           = dvbHelperInstance.getDuration(timeSlot);
    var startStation       = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var reprompt           = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    cardArray              = [];

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation) || _.isEmpty(timeSlot)) {
      var prompt = 'Ich habe habe nicht alles verstanden. Versuche es nochmal.';
      res.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.route(startStation, destinationStation, duration, deparr).then(function (data) {
            console.log('DATA' + data);
            if (data !== null) {
                var result = JSON.stringify(data, null, 4);
                var tripsArray = JSON.parse(result);
                var tripsLength = tripsArray.trips.length;
                var resultObject = [];

                for (var i = 0; i < tripsLength; i++) {
                    var trips = dvbHelperInstance.getTrips(tripsArray, i);

                    if (trips.length === 1) {
                        resultObject = dvbHelperInstance.connectionSingleTrip(res, trips, duration);
                        if (resultObject !== undefined) {
                            cardArray.push(resultObject[1]);

                            res.say(resultObject[0]).send();
                            console.log(resultObject[0]);
                        }
                    } else {
                        dvbHelperInstance.resetCardArray();
                        for (var s = 0; s < trips.length; s++) {
                            if (dvbHelperInstance.isInFuture(trips[0].departure.time, duration)) {
                                resultObject = dvbHelperInstance.connectionMultipleTrips(res, s, trips, duration);
                                if (resultObject !== undefined) {
                                    res.say(resultObject[0]).send();
                                    cardArray.push(resultObject[1]);
                                }
                            }
                        }
                    }
                }
                var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation, cardArray);
                dvbHelperInstance.cardCreator(res, cardContent);

                res.say("Das war es.").shouldEndSession(true);
            } else {
                prompt = 'Ich kann keine Ergebnisse für diese Verbindung finden.';
                res.say(prompt).send();
            }
        });
      return false;
    }
 }
);


app.intent('Abfahrtsmonitor', {
  'slots': {
    'STATION': 'STATIONS',
    'RESULTS': 'AMAZON.NUMBER'
  },
  'utterances': ['{|Die} {-|RESULTS} {|nächsten} {|Abfahrten|Fahrten} {|von} {-|STATION}',
  'nach den {-|RESULTS} nächsten {|Abfahrten|Fahrten} von {-|STATION}']
},
  function(req, res) {
    //get the slot
    var stationCode = req.slot('STATION');
    var numResults  = req.slot('RESULTS');
    var reprompt    = 'Sage mir eine Haltestelle.';
    var result;
    cardArray       = [];

    //stationcode = dvbHelperInstance.stringReplacer(stationCode);

    if (_.isEmpty(numResults)) {
        numResults = 3;
    }

    if (_.isEmpty(stationCode)) {
      var prompt = 'Ich habe die Haltestelle nicht verstanden. Versuche es nochmal.';
      res.say(prompt).shouldEndSession(false);
      return true;
    } else {

        dvb.monitor(stationCode, 0, numResults).then(function (data) {
            console.log(data.length);
            if (data.length !== 0) {
                var resultObject = dvbHelperInstance.getStationInfo(res, data);
                setTimeout(function () {
                    console.log(resultObject[0]);
                    var result       = resultObject[0];
                        cardArray    = resultObject[1];
                    var resultText = '';
                    if (result !== undefined) {
                        for (var i = 0; i < result.length; i++) {
                            resultText = resultText + result[i];
                        }

                        res.say(resultText).send();
                        var cardContent = dvbHelperInstance.cardObjectHelper('Abfahrten ' + ' → ' + stationCode ,cardArray);
                        dvbHelperInstance.cardCreator(res, cardContent);
                    }
                }, 500);
            } else {
                prompt = 'Ich kann die Haltestelle nicht finden.';
                console.log(prompt);
                res.say(prompt).send();
            }

        });
        return false;
    }
});

app.intent('AMAZON.HelpIntent', {
  'slots': {

  },
  'utterances': []
},
  function(req, res) {
     res.say("Du kannst zum Beispiel sagen: Die fünf nächsten Fahrten von Postplatz oder von Postplatz nach Liststraße um zwanzig Uhr oder auch von Postplatz nach Liststraße in zwanzig Minuten.").shouldEndSession(false);
});

app.intent('AMAZON.StopIntent', {
  'slots': {
  },
  'utterances': []
},
  function(req, res) {
     res.say("Ich wünsche eine gute Fahrt.");
});

app.intent('AMAZON.CancelIntent', {
  'slots': {
  },
  'utterances': []
},
  function(req, res) {
     res.say("Ich wünsche eine gute Fahrt.");
});


app.sessionEnded(function(req, res) {
  // cleanup the user's server-side session
  res.say('Ich hoffe ich konnte helfen.');
  // no response required
});


app.error = function(exception, req, res) {
    res.say("Sorry, da ist etwas schief gelaufen");
};

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
