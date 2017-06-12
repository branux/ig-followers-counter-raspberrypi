var express = require('express');
var app = express();
var api = require('instagram-node').instagram();
var bodyParser = require('body-parser');
var server = require('http').Server(app);
var request = require('request');
var io = require('socket.io')(server);
var path = require('path');
var bodyParser = require('body-parser');
var os = require("os");

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, '/public')));

api.use({
  client_id: 'xxxxxxx',
  client_secret: 'xxxxxxx'
});

var jsonParser = bodyParser.json()

var hostname = os.hostname();
var local_host = hostname + '.local';

var ig_api_url = 'https://api.instagram.com/v1/users/';
//var redirect_uri = 'http://raspberrypi.local:8080/handleauth';
var redirect_uri = 'http://' + local_host + ':8080/handleauth';
//var base_url = 'http://raspberrypi.local:8080';
var base_url = 'http://' + local_host + ':8080';

var USER_ID;
var TOKEN;

app.get('/authorize_user', function(req,res) {
  res.redirect(
    api.get_authorization_url(redirect_uri));
});

app.get('/handleauth', function(req, res) {
  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
    if (err) {
      console.log(err.body);
      res.send("Didn't work");
    } else {
      console.log("Access token: " + result.access_token);
      console.log("User ID: " + result.user.id);
      //res.send("You made it!")
      TOKEN = result.access_token;
      USER_ID = result.user.id;
      res.redirect(base_url);
      make_get();
    }
  });
});

function make_get() {
  request.get(ig_api_url + USER_ID + '/?access_token=' + TOKEN, function(err, res, body) {
	var response = jsonSafeParse(body);
	if(response != undefined) {		
		console.log("Username: " + response.data.username);
    	console.log("Name: " + response.data.full_name);
    	console.log("Followers: " + response.data.counts.followed_by);
    	io.emit('responseEvent', response);
    	setTimeout(make_get, 20000);		
	} else {
    	console.log("ERROR! Caught undefined");
        setTimeout(make_get, 100);
		return;
	}	
  });
}

function jsonSafeParse (json) {
	var parsed
	try {
		parsed = JSON.parse(json)
	} catch(e) {
		console.log("JSON ERROR caught: " + e.message)	
	}  
	return parsed
}

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

server.listen(8080, local_host, function() {
 var host = server.address().address
 var port = server.address().port
 console.log("Server listening on %s:%s...", host, port);
});
