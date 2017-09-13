/*jslint node: true */ /*global define */
var _             = require('lodash');
//moment = require('moment');
var dvb           = require('dvbjs');
moment            = require('moment-timezone');
var cardArray     = [];
var responseArray = [];

var dvbHelper = function (){
   var self = this;
   console.log('dvbHelper');

   /**
    * Set a time based on a given duration in minutes
    * @param  {[int]} timeSlot a given number which defines the minutes
    * @return {[date]} returns a date object
    */
   self.getDuration = function (timeSlot){
       var currentTime = moment().add(1, 'hours').add(timeSlot, 'minutes');

       return currentTime.toDate();
   };

   /**
    * Gets time by a timeslot
    * @param  {[string]} timeSlot hours and minutes devided by :
    * @return {[date]} returns a date object
    */
   self.getTime = function (timeSlot){
       var time = new Date();

       if (!_.isEmpty(timeSlot)) {
           var timeArray = timeSlot.split(':');
           time.setHours(timeArray[0],timeArray[1],0,0);
       }
       return time;
   };

   /**
    * Get all trips from multiple trips array
    * @param  {[json]} data the data of trips
    * @param  {[int]} i    the number of trip which data should be returned
    * @return {[json]}      The JSON of the defined trip
    */
   self.getTrips = function(data, i) {
       var tmp         = JSON.stringify(data.trips[i].nodes);
       tmp             = JSON.parse(tmp);
       var nodesLength = tmp.length;
       var tmpArray    = [];

       for (var q      = 0; q < tmp.length; q++) {
           tmpArray.push(tmp[q]);
       }
       tmpArray = JSON.stringify(tmpArray, null, 4);
       tmpArray = JSON.parse(tmpArray);
       return tmpArray;
   };

   /**
    * Replaces umlauts
    * @param  {[string]} string the string where the replacement should happen
    * @return {[string]}  the replaced string
    */
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

   /**
    * The cardObjectHelper creates a cardObject
    * @param  {[string]} title     the title of the card
    * @param  {[object]} cardArray with the text of the card
    * @return {[object]}           a cardObject
    */
   self.cardObjectHelper = function (title, cardArray) {
       var cardContent = '';
       for (var i = 0; i < cardArray.length; i++) {
           cardContent = cardContent + cardArray[i] + ', ';
       }
       console.log('Card Content',cardContent);
       return {
          type: "Simple",
          title: title,
          content: cardContent,
      };
  };


   /**
    * Creates a card
    * @param  {[event]} response   the event response
    * @param  {[object]} dataObject a cardObject
    */
   self.cardCreator = function (response, dataObject) {
       response.card(dataObject);
   };

   // TODO
   self.connectionMultipleTrips = function (res, s, trips, time) {
       var result;
       var cardText;
       var mode          = trips[s].mode.title;
       var line          = trips[s].line;
       var direction     = trips[s].direction;
           direction     = direction.replace(/"/g, '');
       var departure,
       departureTime,
       departureTimeString,
       arrival,
       arrivalTime,
       arrivalTimeString;
       if (trips[s].departure) {
            departure     = trips[s].departure.stop;
            departureTime = new Date(trips[s].departure.time);
            departureTimeString = departureTime.getHours() +':' + (departureTime.getMinutes()<10?'0':'') + departureTime.getMinutes();
       } else {
            departure     = 'Fussweg';
       }
       if (trips[s].arrival) {
            arrival     = trips[s].arrival.stop;
            arrivalTime   = new Date(trips[s].arrival.time);
            arrivalTimeString = arrivalTime.getHours() +':' + (arrivalTime.getMinutes()<10?'0':'') + arrivalTime.getMinutes();
       } else {
            arrival     = 'Fussweg';
       }

       if (self.isInFuture(departureTime, time)) {
           if (s === 0 && departure !== 'Fussweg') {
               console.log( "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTimeString + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTimeString + " Uhr.");
               result   = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTimeString + " Uhr," + " ist die Ankunft an der Haltestelle " + arrival + ' um ' + arrivalTimeString + " Uhr.";
               cardText = mode + ' Linie ' + line + ' Richtung ' + direction + ', ' +  departureTimeString + ' → ' + arrivalTimeString + ', ';
           } else if (departure !== 'Fussweg') {
                console.log(trips[s].departure.stop, trips[s].arrival.stop, "Danach "+ departureTimeString + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + " ist die Ankunft am Ziel " + arrival + ' um ' + arrivalTimeString + " Uhr.");
               result   = "Danach "+ String + " Uhr, weiter mit " + mode + " der Linie " + line + " Richtung " + direction + ". Die Ankunft am Ziel " + arrival + ' ist um ' + arrivalTimeString + " Uhr.";
               cardText = mode + ' Linie ' + line + ' Richtung ' + direction + ', ' +  departureTimeString + ' → ' + arrivalTimeString + ', ';
           }
           cardArray.push(cardText);
           return [result, cardArray];
       } else {
           return;
       }


   };

   self.connectionSingleTrip = function (res, trips, time) {
       var result;
       var cardText;
       var mode          = trips[0].mode.title;
       var line          = trips[0].line;
       var direction     = trips[0].direction;
           direction     = direction.replace(/"/g, '');
       var departure,
       departureTime,
       departureTimeString,
       arrival,
       arrivalTime,
       arrivalTimeString;
       if (trips[0].departure) {
            departure     = trips[0].departure.stop;
            departureTime = new Date(trips[0].departure.time);
            departureTimeString = departureTime.getHours() +':' + (departureTime.getMinutes()<10?'0':'') + departureTime.getMinutes();
       } else {
            departure     = 'Fussweg';
       }
       if (trips[0].arrival) {
            arrival     = trips[0].arrival.stop;
            arrivalTime   = new Date(trips[0].arrival.time);
            arrivalTimeString = arrivalTime.getHours() +':' + (arrivalTime.getMinutes()<10?'0':'') + arrivalTime.getMinutes();
       } else {
            arrival     = 'Fussweg';
       }

       self.resetCardArray();

       var isInFuture = self.isInFuture(departureTime, time);

       if (mode === "Fussweg" || !isInFuture) {
           return;
       } else {
           console.log("Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTimeString + " Uhr," + " ist die Ankunfszeit " + arrivalTimeString + " Uhr.");
           result   = "Mit " + mode + " der Linie " + line + " Richtung " + direction + " um " + departureTimeString + " Uhr," + " ist die Ankunfszeit " + arrivalTimeString + " Uhr.";
           cardText = mode + ' Linie ' + line + ' Richtung ' + direction + ', ' +  departureTimeString + ' → ' + arrivalTimeString + ', ';
           cardArray.push(cardText);
           return [result, cardArray];
       }
   };

   self.getStationInfo = function (res, data) {
       var zeit;
       var result;
       var length      = data.length;
       var resultArray = [];

       for (var i      = 0; i < length; i++) {
           zeit = moment(data[i].arrivalTime, "x").locale("de").fromNow();

           if (length === 0 || (i + 1) === length) {

               console.log( 'Linie ' + data[i].line + ' nach ' + self.getRightStationName(data[i].direction) + ' ' + zeit );

               result   = 'Linie ' + data[i].line + ' nach ' + self.getRightStationName(data[i].direction) + ' ' + zeit;
               cardText = 'Linie ' + data[i].line + ' Richtung ' + data[i].direction + ' → ' +  zeit + ', , ';
               cardArray.push(cardText);

               resultArray.push(result);
           } else {

               console.log( 'Linie ' + data[i].line + ' nach ' + self.getRightStationName(data[i].direction) + ' ');

               result   = 'Linie ' + data[i].line + ' nach ' + self.getRightStationName(data[i].direction) + ' ' + zeit + ' und ';
               cardText = 'Linie ' + data[i].line + ' Richtung ' + data[i].direction + ' → ' +  zeit  + ', , ';
               cardArray.push(cardText);

               resultArray.push(result);
           }
       }
       return [resultArray, cardArray];
   };

   self.getRightStationName = function (name) {
       name = name.toString();
       name = name.replace(/Hp./g, 'Haltepunkt');
       name = name.replace(/Industriegeb./g, 'Industriegebiet');
       name = name.replace(/Pennrich/g, 'Penrich');
       name = name.replace(/Reick/g, 'Reik');
       name = name.replace(/Btf/g, 'Betriebshof');
       return name;
   };

   /**
    * checks if the given triptime is before the wanted departureTime
    * @param  {[type]}  time       time = tripTime
    * @param  {[type]}  wantedTime the time the user want to depart
    * @return {Boolean}            is true if the trip is after the wanted time and false if it's before
    */
   self.isInFuture = function(time, wantedTime) {
       var wishedTime = new moment(wantedTime);
       var timeInput = new Date(time);
       var departure  = new Date();
       departure.setHours(timeInput.getHours(),timeInput.getMinutes(),0,0);

      if ( wishedTime.isBefore(departure)) {
          return true;
      } else {
          return false;
      }
   };

   self.resetCardArray = function() {
       cardArray = [];
   };
};

module.exports = dvbHelper;
