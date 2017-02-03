var _ = require('lodash');

var dvbHelper = function (){
   var self = this;
   console.log('dvbHelper');

   self.getTime = function (timeSlot){
       var time = new Date();
       time.setHours(time.getHours()+1);
       console.log(time, timeSlot);

       if (!_.isEmpty(timeSlot)) {
           console.log("timeSlot is empty");
           var timeArray = timeSlot.split(':');
           time.setHours(timeArray[0],timeArray[1],0,0);
       }
       console.log(time);
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
   }

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
};

module.exports = dvbHelper;
