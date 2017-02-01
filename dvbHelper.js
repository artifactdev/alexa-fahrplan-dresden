var _ = require('lodash');

var dvbHelper = function (){
   var self = this;
   console.log('dvbHelper');

   self.getTime = function (timeSlot){
       var time = new Date();
       time.setHours(time.getHours()+1);

       if (!_.isEmpty(timeSlot)) {
           var timeArray = timeSlot.split(':');
           time.setHours(timeArray[0],timeArray[1],0,0);
       }

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
};

module.exports = dvbHelper;
