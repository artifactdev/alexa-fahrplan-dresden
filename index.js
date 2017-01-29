'use strict';
module.change_code = 1;
var _ = require('lodash');
var Alexa = require('alexa-app');
var dvb = require('dvbjs');
var moment = require('moment');
var app = new Alexa.app('dvb-verbindungsauskunft');

app.launch(function(req, res) {
  var prompt = 'Nenne mir Starthaltestelle, Zielhaltestelle und in wieviel Minuten es losgehen soll.';
  res.say(prompt).reprompt(prompt).shouldEndSession(false);
});

app.intent('Verbindungsauskunft', {
  'slots': {
    'STARTSTATION': 'STATIONS',
    'DESTINATIONSTATION': 'STATIONS'
    //'OFFSET': 'AMAZON.DURATION'
  },
  'utterances': ['{-|STARTSTATION} {|DESTINATIONSTATION}']
},
  function(req, res) {
    //get the slot
    var startStation = req.slot('STARTSTATION');
    var destinationStation = req.slot('DESTINATIONSTATION');
    var time = new Date(); // starting at what time
    var reprompt = 'Sage mir eine Haltestelle und die Zielhaltestelle und wann es losgehen soll.';

    function stationConverter(value) {
        value = value.toString();
        value = value.toLowerCase();
        value = value.replace(/ä/g, 'ae');
        value = value.replace(/ö/g, 'oe');
        value = value.replace(/ü/g, 'ue');
        value = value.replace(/ß/g, 'ss');
        value = value.replace(/ /g, '-');
        value = value.replace(/\./g, '');
        value = value.replace(/,/g, '');
        value = value.replace(/\(/g, '');
        value = value.replace(/\)/g, '');
        value = value.replace(/ /g, '');
        return value;
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
            console.log(result);
            var tripsArray = JSON.parse(result);
            var tripsLength = tripsArray.trips.length;
            //console.log(data);
            for (var i = 0; i < tripsLength; i++) {
                console.log(tripsArray.trips[i]);
                var tripsArray2 = JSON.stringify(tripsArray.trips[i]);
                var tripArray =  JSON.stringify(tripsArray2);
                var trip = JSON.stringify(tripArray);

                //console.log(tripArray);
                

            }

        });
        /*dvb.monitor(stationCode, timeOffset, numResults, function(err, data) {
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
            }
        });*/

      return false;
    }
  }
);
//hack to support custom utterances in utterance expansion string
console.log(app.utterances().replace(/\{\-\|/g, '{'));
module.exports = app;
