/*jslint node: true */ /*global define */
var _ = require('lodash');
moment = require('moment');
var cardArray = [];
var responseArray = [];

var dvbHelper = function (){
   var self = this;
   console.log('dvbHelper');

   self.getDuration = function (timeSlot){
       var currentTime = new moment();
       var duration = moment.duration(timeSlot);
       var futureDate = currentTime.add(duration);


       var time = moment.tz(futureDate, "Europe/Berlin").toDate();
       console.log(currentTime, time);
       return time;
   };

   self.getTime = function (timeSlot){
       var time = new Date();

       if (!_.isEmpty(timeSlot)) {
           var timeArray = timeSlot.split(':');
           time.setHours(timeArray[0],timeArray[1],0,0);
       }
       console.log(time);
       //time = moment.tz(time, "Europe/Berlin").toDate();
       return time;
   };

   // Gets all the tripinfos from Array
   self.getTrips = function(data, i) {
       var tmp = JSON.stringify(data.trips[i].nodes);
       tmp = JSON.parse(tmp);
       var nodesLength = tmp.length;
       var tmpArray = [];
       for (var q = 0; q < tmp.length; q++) {
           tmpArray.push(tmp[q]);
       }
       tmpArray = JSON.stringify(tmpArray, null, 4);
       tmpArray = JSON.parse(tmpArray);
       return tmpArray;
   };

   self.stringReplacer = function (string) {
       string = string.toString();
       string = string.toLowerCase();
       string = string.replace(/ä/g, 'ae');
       string = string.replace(/ö/g, 'oe');
       string = string.replace(/ü/g, 'ue');
       string = string.replace(/ß/g, 'ss');
       string = string.replace(/ /g, '-');
       string = string.replace(/\./g, '');
       string = string.replace(/,/g, '');
       string = string.replace(/\(/g, '');
       string = string.replace(/\)/g, '');
       string = string.replace(/ /g, '');
       return string;
   };

   self.removeUndefined = function (string) {
       string = string.toString;
       string = string.replace(/undefinded/g, '');
       return string;
   };

   self.cardObjectHelper = function (title, cardArray) {
       var cardContent = '';
       for (var i = 0; i < cardArray.length; i++) {
           cardContent = cardContent + cardArray[i] + '\n';
       }
       return {
          type: "Simple",
          title: title,
          content: cardContent,
      };
  };

   self.cardCreator = function (response, dataObject) {
       response.card(dataObject);
   };

   self.connectionMultipleTrips = function (res, s, trips) {
       var result;
       var cardText;
       var mode = trips[s].mode;
       var line = trips[s].line;
       var direction = trips[s].direction;
           direction = direction.replace(/"/g, '');
       var departure = trips[s].departure.stop;
       var departureTime = trips[s].departure.time;
       var arrival = trips[s].arrival.stop;
       var arrivalTime = trips[s].arrival.time;

       if (s === 0) {
           console.log(trips[s].departure.stop, trips[s].arrival.stop, "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTime + " Uhr.");
           result = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTime + " Uhr.";
           cardText = mode + ' Linie ' + line + ' Richtung ' + direction + '\n' +  departureTime + ' → ' + arrivalTime + '\n';
       } else {
           console.log(trips[s].departure.stop, trips[s].arrival.stop, "Danach "+ departureTime + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + " ist die Ankunft am Ziel " + arrival + ' um ' + arrivalTime + " Uhr.");
           result = "Danach "+ departureTime + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + ". Die Ankunft am Ziel " + arrival + ' ist um ' + arrivalTime + " Uhr.";
           cardText = mode + ' Linie ' + line + ' Richtung ' + direction + '\n' +  departureTime + ' → ' + arrivalTime + '\n';
       }
       cardArray.push(cardText);
       return [result, cardArray];
   };

   self.connectionSingleTrip = function (res, trips) {
       var result;
       var cardText;
       var mode = trips[0].mode;
       var line = trips[0].line;
       var direction = trips[0].direction;
           direction = direction.replace(/"/g, '');
       var departure = trips[0].departure.stop;
       var departureTime = trips[0].departure.time;
       var arrival = trips[0].arrival.stop;
       var arrivalTime = trips[0].arrival.time;

       self.resetCardArray();

       if (mode === "Fussweg") {
           return;
       } else {
           console.log("Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr.");
           result = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTime + " Uhr," + " ist die Ankunfszeit " + arrivalTime + " Uhr.";

           cardText = mode + ' Linie ' + line + ' Richtung ' + direction + '\n' +  departureTime + ' → ' + arrivalTime + '\n';
           cardArray.push(cardText);
           return [result, cardArray];
       }
   };

   self.resetCardArray = function() {
       cardArray = [];
   };
};

module.exports = dvbHelper;
