/*jslint node: true */ /*global define */
'use strict';
module.change_code    = 1;
var _                 = require('lodash');
var Alexa = require("alexa-app");
var app               = new Alexa.app('fahrplan-dresden');
var dvb               = require('dvbjs');
var moment            = require('moment');
var waitUntil         = require('wait-until');
var dvbHelper         = require('./dvbHelper.js');
var dvbHelperInstance = new dvbHelper();
var cardArray         = [];

app.launch(function(request, response) {
  var prompt = 'Frage nach Abfahrten oder Verbindungen.';
  response.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('Verbindungsauskunft', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS',
    'TIME': 'AMAZON.TIME'
  },
  'utterances': ['{|Von} {-|STARTSTATION} {nach} {-|DESTINATIONSTATION} um {-|TIME}', 'nach Verbindung von {-|STARTSTATION} nach {-|DESTINATIONSTATION} um {-|TIME}']
},
  function(request, response) {
    //get the slot
    var timeSlot           = request.slot('TIME'); // starting at what time
    var time               = dvbHelperInstance.getTime(timeSlot);
    var startStation       = request.slot('STARTSTATION');
    var destinationStation = request.slot('DESTINATIONSTATION');
    var reprompt           = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    cardArray              = [];

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation)) {
      var prompt = 'Ich habe habe eine der Haltestellen nicht verstanden.';
      response.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    }

    dvb.findStop(startStation, function(err, data){
       if (err) throw err;
       var ID = data[0].id;
       startStation = ID;
       console.log(data[0]);
       getDestinationID();
   });



   function getDestinationID() {
       dvb.findStop(destinationStation, function(err, data){
           if (err) throw err;
           var ID = data[0].id;
           destinationStation = ID;
           getTripData(startStation,destinationStation);
       });
   }

    function getTripData(startStation,destinationStation) {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.route(startStation, destinationStation, time, deparr).then( function(data) {
            console.log(data);
            if (data !== null) {
                var result       = JSON.stringify(data, null, 4);
                var tripsArray   = JSON.parse(result);

                var tripsLength  = tripsArray.trips.length;
                var resultObject = [];


                for (var i = 0; i < tripsLength; i++) {
                    var trips = dvbHelperInstance.getTrips(tripsArray, i);

                    if (trips.length === 1) {
                        resultObject = dvbHelperInstance.connectionSingleTrip(response. trips, time);
                        if (resultObject !== undefined) {
                            response.say(resultObject[0]).send();
                            console.log(JSON.stringify(resultObject[0]));
                            cardArray.push(JSON.stringify(resultObject[1]));
                            return false;
                        }
                    } else {
                        dvbHelperInstance.resetCardArray();
                        for (var s = 0; s < trips.length; s++) {
                            if (dvbHelperInstance.isInFuture(trips[0].departure.time, time)) {
                                resultObject = dvbHelperInstance.connectionMultipleTrips(response. s, trips, time);
                                if (resultObject !== undefined) {
                                    console.log(resultObject);
                                    response.say(resultObject[0]).send();
                                    cardArray.push(JSON.stringify(resultObject[1]));
                                    return false;
                                }
                            }
                        }
                    }
                }
                var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation,cardArray);
                dvbHelperInstance.cardCreator(response. cardContent);

                return response.say("Das war es.").shouldEndSession(true);
            } else {
                prompt = 'Ich kann keine Ergebnisse für diese Verbindung finden.';
                response.say(prompt).send();
            }
            response.send();
        });
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
  function(request, response) {
    //get the slot
    var timeSlot           = request.slot('MINUTES'); // starting at what time
    var duration           = dvbHelperInstance.getDuration(timeSlot);
    var startStation       = request.slot('STARTSTATION');
    var destinationStation = request.slot('DESTINATIONSTATION');
    var reprompt           = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';
    cardArray              = [];

    if (_.isEmpty(startStation) || _.isEmpty(destinationStation) || _.isEmpty(timeSlot)) {
      var prompt = 'Ich habe habe nicht alles verstanden. Versuche es nochmal.';
      response.say(prompt).reprompt(reprompt).shouldEndSession(false);
      return true;
    } else {
        var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

        dvb.findStop(startStation, function(err, data){
           if (err) throw err;
           var ID = data[0].id;
           startStation = ID;
           console.log(data[0]);
           getDestinationIDMinutes();
       });

      return false;
    }

    function getDestinationIDMinutes() {
        dvb.findStop(destinationStation, function(err, data){
            if (err) throw err;
            var ID = data[0].id;
            destinationStation = ID;
            getTripDataMinutes(startStation,destinationStation);
        });
    }

    function getTripDataMinutes(startStation,destinationStation) {
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
                        resultObject = dvbHelperInstance.connectionSingleTrip(response. trips, duration);
                        if (resultObject !== undefined) {
                            cardArray.push(resultObject[1]);

                            response.say(resultObject[0]).send();
                            console.log(resultObject[0]);
                        }
                    } else {
                        dvbHelperInstance.resetCardArray();
                        for (var s = 0; s < trips.length; s++) {
                            if (dvbHelperInstance.isInFuture(trips[0].departure.time, duration)) {
                                resultObject = dvbHelperInstance.connectionMultipleTrips(response. s, trips, duration);
                                if (resultObject !== undefined) {
                                    response.say( resultObject[0]).send();
                                    cardArray.push(resultObject[1]);
                                }
                            }
                        }
                    }
                }
                var cardContent = dvbHelperInstance.cardObjectHelper(startStation + ' → ' + destinationStation, cardArray);
                dvbHelperInstance.cardCreator(response. cardContent);

                response.say("Das war es.").shouldEndSession(true);
            } else {
                prompt = 'Ich kann keine Ergebnisse für diese Verbindung finden.';
                response.say(prompt).send();
            }
        });
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
    var stationCode = request.slot('STATION');
    var numResults  = request.slot('RESULTS');
    var reprompt    = 'Sage mir eine Haltestelle.';
    var result;
    cardArray       = [];

    //stationcode = dvbHelperInstance.stringReplacer(stationCode);

    if (_.isEmpty(numResults)) {
        numResults = 3;
    }

    if (_.isEmpty(stationCode)) {
      var prompt = 'Ich habe die Haltestelle nicht verstanden. Versuche es nochmal.';
      response.say(prompt).shouldEndSession(false);
      return true;
    } else {

        dvb.findStop(stationCode, function(err, data){
           if (err) throw err;
           var ID = data[0].id;
           var stationID = ID;
           console.log(data[0]);

           dvb.monitor(stationID, 0, numResults).then(function (data) {
               console.log(data.length);
               if (data.length !== 0) {
                   var resultObject = dvbHelperInstance.getStationInfo(response. data);
                   setTimeout(function () {
                       console.log(resultObject[0]);
                       var result       = resultObject[0];
                           cardArray    = resultObject[1];
                       var resultText = '';
                       if (result !== undefined) {
                           for (var i = 0; i < result.length; i++) {
                               resultText = resultText + result[i];
                           }

                           response.say(resultText).send();
                           var cardContent = dvbHelperInstance.cardObjectHelper('Abfahrten ' + ' → ' + stationCode ,cardArray);
                           dvbHelperInstance.cardCreator(response. cardContent);
                       }
                   }, 500);
               } else {
                   prompt = 'Ich kann die Haltestelle nicht finden.';
                   console.log(prompt);
                   response.say(prompt).send();
               }

           });
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
     response.say("Du kannst zum Beispiel sagen: Die fünf nächsten Fahrten von Postplatz oder von Postplatz nach Liststraße um zwanzig Uhr oder auch von Postplatz nach Liststraße in zwanzig Minuten.").shouldEndSession(false);
});

app.intent('AMAZON.StopIntent', {
  'slots': {
  },
  'utterances': []
},
  function(req, res) {
     response.say("Ich wünsche eine gute Fahrt.");
});

app.intent('AMAZON.CancelIntent', {
  'slots': {
  },
  'utterances': []
},
  function(req, res) {
     response.say("Ich wünsche eine gute Fahrt.");
});


app.sessionEnded(function(req, res) {
  // cleanup the user's server-side session
  response.say('Ich hoffe ich konnte helfen.');
  // no response required
});


app.error = function(exception, req, res) {
    response.say("Sorry, da ist etwas schief gelaufen");
};

//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
exports.handler = app.lambda();
module.exports = app;
