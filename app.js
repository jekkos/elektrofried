var config = require('./config');
var server = require('http').Server(), io = require('socket.io').listen(config.DEFAULT_PORT);
var logger = require('winston');
var twitterer = require('./twitterer');
var gifBuilder = require('./gifbuilder');
var tileBuilder = require('./tilebuilder');
var serialConnector = require('./serialconnector');
var frameGrabber = require('./framegrabber');

Object.spawn = function (parent, props) {
	var defs = {}, key;
	for (key in props) {
		if (props.hasOwnProperty(key)) {
			defs[key] = {value: props[key], enumerable: true};
		}
	}
	return Object.create(parent, defs);
};

exports.app = (function() {
	
	var dimensions = {
	    x : 2,
	    y : 2,
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
	
	var tweet = Object.spawn(frameGrabber.frame, {
		getMessage : function() {
			return this.message.replace(/\$score/g, this.score) || config.DEFAULT_MESSAGE;
		},
		getTitle : function() {
			return this.title || config.DEFAULT_TITLE;
		},
		getPlaceId : function() {
			return this.placeId || config.DEFAULT_PLACE_ID;
		}
	});
	
	var tweetPic = function(socket) {
		return function(data) {
			var fileName = config.TMP_TILE_DIR + "/" + new Date().getMilliseconds() + ".jpg";
			logger.info("About to upload " + fileName + " to twitter");
			tileBuilder.build(fileName, frameGrabber.getFrames(), options.dimensions, function (err) {
				if (err) {
					logger.error(err);
				} else {
					currentTweet = Object.spawn(tweet, {message : data.message, score: score,
						placeId : data.placeId || options.placeId, 
						fileName : fileName});
					twitterer.upload(currentTweet);
					socket.emit("pic-tweeted", {
						url : currentTweet.getUrl()
					});
				}
			});
		};
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
		for (var i = 0; i < sockets.length; i++) {
			sockets[i].emit("frame", frame.getUrl());
		}
	});
	logger.info("Initializing serial connector " + JSON.stringify(serialConnector));
	serialConnector.init();
	
	io.on('connection', function(socket) {
		sockets.push(socket);
		logger.info('socket opened!');
		socket.on('disconnect', function() {
			sockets.splice(sockets.indexOf(socket), 1);
		});
		socket.on('grab-start', frameGrabber.startGrabbing);
		socket.on('grab-stop', frameGrabber.stopGrabbing);
		socket.on('shock', function(data) {
			serialConnector.shock();
		});
		socket.on('game-started', function(data) {
			// parse options from data
			parseOptions(socket);
			score = 0;
			serialConnector.startGame();
			frameGrabber.startGrabbing(options);
		});
		socket.on('game-stopped', function(data) {
			// feedback to teensy
			score = data.score;
			// name and email?
			serialConnector.stopGame();
			frameGrabber.stopGrabbing();
		});
		socket.on('tweet', tweetPic(socket));
		socket.on('options', parseOptions(socket));
	});
	
	
	return this;
})();
