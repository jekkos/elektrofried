var Camelot = require('camelot'), events = require('events');
var server = require('http').Server(), io = require('socket.io').listen(8080);
var logger = require('winston');
var twitterer = require('./twitterer');
var gifBuilder = require('./gifbuilder');
var tileBuilder = require('./tilebuilder');
var SerialPort = require("serialport").SerialPort;

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
	
	var SERVER_URL = 'http://localhost/elektrofried/';
	var FILE_ROOT = '/home/jekkos/workspace/elektrofried/';
	var DEFAULT_TITLE = 'Elektrofried!';
	var DEFAULT_MESSAGE = 'Test twitpic upload';
	var FRAME_SIZE = 3;
	var TMP_DIR = 'tmp/camelot/';
	var TMP_TILE_DIR = 'tmp/tiles';
	
	var serial = new SerialPort("/dev/ttyUSB0", {
		  baudrate: 9600
	});
	
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
		placeId : '@appsaloon',
		quality : 90,
		message : DEFAULT_MESSAGE
	};
	
	var sockets = [];
	var frames = [];
	var tweets = [];
	
	// contains animated gif 
	var frame = {
		getPath : function() {
			return FILE_ROOT + this.fileName;
		},
		getUrl : function() {
			return SERVER_URL + this.fileName;
		}
	};
	
	var tweet = Object.spawn(frame, {
		getMessage : function() {
			return this.message;
		},
		getTitle : function() {
			return this.title || DEFAULT_TITLE;
		},
		getPlaceId : function() {
			return this.placeId;
		}
	});
	
	//pic has: filepaht, tweet, 
	var camelot = new Camelot( {
		'device' : '/dev/video0',
		'input' : 0,
		'skip' : 1,
		'no-banner' : true,
		'resolution' : dimensions.toString(),
		'controls' : {
			brightness : 2,
			contrast : 3,
			saturation : 3,
			hue : 0,
			sharpness : 9,
			gamma : 1
		}
	});
	
	camelot.on('frame', function (fileName) {
		logger.info('frame received!');
		for (var i = 0; i < sockets.length; i++) {
			var newFrame = Object.spawn(frame, {
				fileName : fileName
			});
			frames.push(newFrame);
			sockets[i].emit("frame", newFrame.getUrl());
		}
	});
	
	camelot.on('error', function (err) {
		logger.error(err.toString());
	});
	
	var grabPic = function(data) {
		camelot.grab( {
			'frequency' : data.frequency || options.frequency,
			'jpeg' : data.quality || options.quality
		});
	};
	
	var tweetPic = function(socket) {
		return function(data) {
			var fileName = TMP_TILE_DIR + "/" + new Date().getMilliseconds() + ".jpg";
			// TODO output filename.. best to specify???
			var lastFrame = frames[frames.length - 1];
			tileBuilder.build(fileName, frames, options.dimensions, function (err) {
				if (err) {
					logger.error(err);
				} else {
					var newTweet = Object.spawn(tweet, {message : data.message, 
						placeId : data.placeId || options.placeId, 
						fileName : fileName});
					twitterer.upload(newTweet);
					socket.emit("tiledpic", {
						url : newTweet.getUrl()
					});
				}
			});
		// create animated gif...
		/*var gif = gifBuilder.build(fileName, frames, dimensions, function(status, error) {
			if (status) {
				logger.info('tweeting');
				tweets.push(newTweet);
			} else {
				logger.error(error);
			}
		});*/
		};
	};
	io.on('connection', function(socket) {
		sockets.push(socket);
		logger.info('socket opened!');
		socket.on('disconnect', function() {
			sockets.splice(sockets.indexOf(socket), 1);
		});
		socket.on('grab', grabPic);
		socket.on('stop', camelot.stop);
		socket.on('shock', function() {
			serialPort.write("s\n", function(err, results) {
				logger.error(err);
				logger.info('results ' + results);
			});
		});
		socket.on('tweet', tweetPic(socket));
		socket.on('options', function(data) {
			if (data) {
				options = Object.spawn(options, data);
				logger.info("Options changed " + JSON.stringify(options));
			} else {
				socket.emit('options', options);
			}
		});
	});
	
	
	return this;
})();
