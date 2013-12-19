var config = require('./config');
require('./common');
var server = require('http').Server(), io = require('socket.io').listen(config.DEFAULT_PORT);
var logger = require('winston');
var twitterer = require('./twitterer').twitterer;
var gifBuilder = require('./gifbuilder');
var tileBuilder = require('./tilebuilder').tileBuilder;
var serialConnector = require('./serialconnector').serialConnector;
var frameGrabber = require('./framegrabber').frameGrabber;

var tweet = require('./twitterer').tweet;
var frame = require('./framegrabber').frame;

exports.app = (function() {
	
	var dimensions = {
	    x : config.TILE_WIDTH,
	    y : config.TILE_HEIGHT,
		width : 640,
		height : 480,
		toString : function() {
			return this.width + 'x' + this.height;
		}
	};
	
	var options = {
		dimensions : dimensions,
		frequency : 1,
		placeId : config.DEFAULT_PLACE_ID,
		quality : 90,
		message : config.DEFAULT_MESSAGE
	};
	
	var sockets = [];
	var tweets = [];
	var score;
	var lastFileName;
	var lastTweet;
	
	var postTweet = function(data) {
		lastTweet = Object.spawn(tweet, {
			message : data.message || config.DEFAULT_MESSAGE, 
			score: score, 
			name: data.name, 
			email : data.email,
			placeId : data.placeId || options.placeId, 
			fileName : data.fileName || lastFileName});
		logger.info("posting tweet " + JSON.stringify(lastTweet)); 
		twitterer.tweet(lastTweet);
	};
	
	var prepareTweet = function(socket) {
		return function(data) {
			if (!lastFileName) {
				lastFileName = buildTile(socket, postTweet);
			} else {
				postTweet(data);
			}
		};
	};
	
	var buildTile = function(socket, callback) {
		var fileName = config.TMP_TILE_DIR + "/" + new Date().getMilliseconds() + ".jpg";
		tileBuilder.build(fileName, frameGrabber.getFrames(), options.dimensions, function (err) {
			if (err) {
				logger.error(err);
			} else {
				callback && callback.call(this, {
					fileName : fileName
				});
				socket.emit('tile-built', {
					url : config.SERVER_URL + fileName
				});	
			}
		});
		return fileName;
	};
	
	var parseOptions = function(socket) {
		return function(data) {
			if (data) {
				options = Object.spawn(options, data);
				logger.info("options changed " + JSON.stringify(options));
			} else {
				socket.emit('options', options);
			}
		};
	};
	
	frameGrabber.init(dimensions, function(frame) {
		for (index in sockets) {
			logger.debug("sending frame-grabbed");
			sockets[index].emit("frame-grabbed", frame.getUrl());
		}
	});
	
	logger.info("initializing serial connector " + JSON.stringify(serialConnector));
	serialConnector.init(function(status) {
		logger.debug("sending input-received");
		for(index in sockets) {
			sockets[index].emit("input-received", status);
		}
	});
	
	io.on('connection', function(socket) {
		sockets.push(socket);
		logger.info('socket opened to ' + socket.handshake.address);
		socket.on('disconnect', function() {
			sockets.splice(sockets.indexOf(socket), 1);
		});
		socket.on('grab-start', frameGrabber.startGrabbing);
		socket.on('grab-stop', frameGrabber.stopGrabbing);
		socket.on('shock', function(data) {
			serialConnector.shock();
		});
		socket.on('game-started', function(data) {
			logger.info("starting game");
			// parse options from data
			parseOptions(socket);
			score = 0;
			serialConnector.startGame();
			frameGrabber.startGrabbing(options);
			// could solve this better with 'rooms'?
		});
		socket.on('game-stopped', function(data) {
			logger.info("stopping game");
			// feedback to teensy
			score = data.score;
			// name and email?
			serialConnector.stopGame();
			frameGrabber.stopGrabbing();
			// create tile and send back!
			lastFileName = buildTile(socket);
		});
		socket.on('tweet', prepareTweet(socket));
		socket.on('options', parseOptions(socket));
		socket.emit('options', options);
	});
	
	
	return this;
})();
