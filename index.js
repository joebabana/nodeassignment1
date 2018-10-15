const httplib = require("http");
const httpslib = require("https");
const urllib = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
var config = require('./config');
var fs = require('fs');

var httpServer = httplib.createServer(function(req, res) {
	unifiedServer(req,res);
});

httpServer.listen(config.httpPort, function() {
	console.log("Listening now at " + config.envName + " at " + config.httpPort);
});


// Instantiate the HTTPS server.
var httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem')
};

var httpsServer = httpslib.createServer(httpsServerOptions, function(req, res) {
	unifiedServer(req,res);
});
// Start the HTTPS Server.
httpsServer.listen(config.httpsPort, function() {
	console.log("Listening now at " + config.envName + " at " + config.httpsPort);
});

// All the server logic for both http and https server
var unifiedServer = function(req,res) {
	var parsedUrl = urllib.parse(req.url, true);
	var path = parsedUrl.pathname;
	var trimmedPath = path.replace(/^\/+|\/+$/g, '');
	var queryStringObject = parsedUrl.query;
	var method = req.method.toLowerCase();

	var headers = req.headers;
	
	var decoder = new StringDecoder('utf-8');
	var buffer = '';

	req.on('data', function(data) {
		buffer += decoder.write(data);
	});

	req.on('end', function() {
		buffer += decoder.end();

		// Choose the handler request should go to.
		var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound;

		var data = { 'trimmedPath' : trimmedPath,
		'queryStringObject':queryStringObject,
		'method': method,
		'headers': headers,
		'payload': buffer
		};

		// Route the request to handler specify in the router
		chosenHandler(data, function(statusCode, payload) {
			statusCode = typeof(statusCode) == 'number'? statusCode : 200;

			payload = typeof(payload) == 'object' ? payload : {};

			var payloadString = JSON.stringify(payload);

			res.setHeader('Content-type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);
			console.log('Returning this response :', statusCode, payloadString);
		});
	});
}; 

// Define a handler
var handlers = {};

// Ping Handler
handlers.ping = function(data, callback) {
	callback(200);
};

handlers.notfound = function(data, callback) {
 callback(404);
};

handlers.forHelloReq = function (data, callback) {
	callback(202, {'message':'Greetings, welcome to Master Class Node Assignment1', 'purpose':'Complete Assignment1', 'version':1.21});
};

// Define a router
var router = {
'sample': handlers.sample,
'hello' : handlers.forHelloReq,
'ping' : handlers.ping
};