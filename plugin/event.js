function toRad(x){ return x * Math.PI / 180; }

function distanceFromVarick(lat2,lon2){
    var lat1 = 40.727517 //175 Varick's lat and long
    var lon1 = -74.005719

    var R = 6371; // km 
    var x1 = lat2-lat1;
    var dLat = toRad(x1);  
    var x2 = lon2-lon1;
    var dLon = toRad(x2);  
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);  
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; 
    return d * 1000; // convert to m
}

successCallback = function(sendResponse) {
    return function(position){
    console.debug(" lat: " + (+position.coords.latitude).toFixed(0));
    console.debug(" long: " + (+position.coords.longitude).toFixed(0));
    console.debug(" acc: " + position.coords.accuracy + " meters");
    var acc = (+position.coords.accuracy).toFixed(0);
    var distance = distanceFromVarick((+position.coords.latitude).toFixed(6),
                                      (+position.coords.longitude).toFixed(6));
    console.debug(distance + 'm from 175 varick')
    sendResponse({distance: distance.toFixed(0), accuracy: acc})
    }
}

chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
      if (request.subject == "location"){
          if(navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(successCallback(sendResponse), 
                    function(err){ sendResponse({error: err}); }, 
                    {maximumAge:5*60*1000, timeout:30*1000});
                return true;
          }
          else{ sendResponse({error: "location api is not supported", fatal: true}); return true; }
      }
      else if (request.subject == "conf"){
          sendResponse({auth_username : localStorage["user"],
                        auth_password : localStorage["password"],
                        server        : localStorage["server"]});
          return true;
      }
      else{ console.warn('unrecognized message'); return true; }
  });
