var express = require('express'),
    redis   = require("redis"),
    log4js  = require('log4js'),
    rClient = redis.createClient();

log4js.loadAppender('file');
log4js.addAppender(log4js.appenders.file('logs/app.log'), 'app');

var KEY_TTL_IN_MINUTES = 3;
var DISTANCE_THRESHOLD = 300; // meters
var logger = log4js.getLogger('app');
logger.setLevel('DEBUG');

rClient.on("redis error", logger.error);

var app = express();
app.use(express.bodyParser());

sendResponse = function(username, res){ return function(err,keys){
    if(err){
        logger.error(err);
        res.send(500, 'doh');
    }
    else{
        if(username && keys.indexOf(username) < 0){ 
            keys.push(username);
            res.send(JSON.stringify(keys)); 
        }
        else{ res.send(JSON.stringify(keys)); } 
    } 
}
}

//the following route is to maintain compatibility with
//requests sent by earlier versions of the associated chrome plugin
app.get('/locations', function(req, res){ 
    logger.debug('responding to GET /locations');
    rClient.keys('*', sendResponse(null,res));}
);

app.post('/location', function(req, res) {
    if(req.body && req.body.distance && req.body.accuracy && req.body.user){
        if(((+req.body.distance) + (+req.body.accuracy)) <= DISTANCE_THRESHOLD){
            rClient.keys('*', sendResponse(req.body.user, res));
            rClient.set(req.body.user, true, redis.print);
            rClient.expire(req.body.user, KEY_TTL_IN_MINUTES * 60, redis.print);
            logger.info("inserted: " + req.body.user + ": " + JSON.stringify(req.body));
        }
        else{
            rClient.keys('*', sendResponse(null,res));
            rClient.del(req.body.user);
            logger.info(req.body.user + ' is too far away (' + (req.body.distance + req.body.accuracy) + '), deleting key ');
        }
    }
    else{
        logger.info('bad request');
        res.send('bad request');
    }
});


app.listen(3000);
logger.info('App.js started up and is listening on port 3000');
