console.debug('humbug.js executed') 

var presence_ul = null;
var user = null;
var onlineUsers = [];
var auth_username = null;
var auth_password = null;
var server = null;
var rightsidebar = document.getElementById('right-sidebar');
var userNameObserver = new WebKitMutationObserver(usernameObserverEvent);
var sideBarObserver = new WebKitMutationObserver(sidebarMutationEvent);
userNameObserver.observe(rightsidebar, {childList: true, subtree: true});

function usernameObserverEvent(){
    presence_ul = document.getElementById('user_presences')
    if(presence_ul){
        var fullname =  document.getElementsByClassName('my_fullname');
        if(fullname && fullname.length){    //if we have found the username
            userNameObserver.disconnect();  //disconnect username observer
            user = fullname[0].innerText;   //and wire up sidebar observer
            sideBarObserver.observe(rightsidebar, {childList: true, subtree: true}); 
            requestLocation();              //trigger immediate update
            setInterval(requestLocation, 60 * 1000); //and set polling loop
        }
    }
}

function sidebarMutationEvent(){
    if(presence_ul){
        sideBarObserver.disconnect(); //disconnect the observer
        user = document.getElementsByClassName('my_fullname')[0].innerText;
        updateUI(onlineUsers);
        sideBarObserver.observe(rightsidebar,  //reconnect observer
                {childList: true, subtree: true});
    }
}

function requestLocation(){

    chrome.extension.sendMessage({subject: "location"}, function(response) {
        if(response.fatal){
            console.error('fatal error, giving up');
            sideBarObserver.disconnect();
        }
        else{
            if(response.error){
                console.warn('error getting location, retrying in 60s');
            }
            else{
                if(user){
                    sendDistanceToServer(user,response.distance, response.accuracy);
                }
                else{
                    console.error('user is still undefined');
                }
            }
        }
    });

}

function sendDistanceToServer(username, dist, acc){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", server, true);
    if(auth_username && auth_password)
    {
        authstr = 'Basic ' + window.btoa(auth_username + ':' + auth_password);
        xhr.setRequestHeader('Authorization', authstr);
    }
    xhr.setRequestHeader("Content-type","application/json; charset=utf-8");
    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4) {
        var resp = JSON.parse(xhr.responseText);
        console.debug(resp)
        onlineUsers = resp;
        updateUI(onlineUsers);
      }
    }
    xhr.send(JSON.stringify({user: username, distance: dist, accuracy: acc}));
}

function updateUI(onlineUsers){
    //clear check mark from all nodes with class 'geolocated'
    _(presence_ul.childNodes).each(function(node){  
        var icons = node.getElementsByTagName('i')
        if(icons && icons.length){
            _.bindAll(node, 'removeChild'); //bind removeChild function's 'this' to node
            _(icons).each(node.removeChild);//so we don't have to wrap this function
        }});

    //add 'geolocated' icons to reflect onlineUsers
    var inOnlineUsers = _.partial(_.contains,onlineUsers);

    var onlineNodes = _(presence_ul.childNodes).filter(function(node){ return inOnlineUsers(node.innerText); });
    _(onlineNodes).each(function(item){
        var icon = document.createElement("i");
        icon.className = 'geolocated icon-home'
        item.appendChild(icon)
    });

}

chrome.extension.sendMessage({subject: "conf"}, function(response) {
    if(!response.server){
        console.warn('server is undefined, plugin disabled');
    }
    else{
        auth_username = response.auth_username;
        auth_password = response.auth_password;
        server = response.server;
    }
});
