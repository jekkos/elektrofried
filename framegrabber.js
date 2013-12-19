var Camelot = require('camelot'), events = require('events');
var logger = require('winston');
var config = require('./config');

var frame = {
	getPath : function() {
		return config.FILE_ROOT + this.fileName;
	},
	getUrl : function() {
		return '../' + this.fileName;
	}
};

var frameGrabber = (function() {

	//pic has: filepaht, tweet, 
	
	var frames = [];
	
	var camelot;
	
	var init = function(dimensions, frameReceived) {
		
		camelot = new Camelot( {
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

		camelot.on('error', function (err) {
			logger.error(err.toString());
		});
		
		camelot.on('frame', function (fileName) {
			logger.info('frame received! ' + config.SERVER_URL +   ' name ' + fileName);
			var newFrame = Object.spawn(frame, {
				fileName : fileName
			});
			frames.push(newFrame);
			frameReceived && frameReceived.call(this, newFrame);
		});
	};
	
	var startGrabbing = function(options) {
		logger.info("start grabbing with " + JSON.stringify(options));
		camelot && camelot.grab( {
			'frequency' : options.frequency,
			'jpeg' : config.JPEG_QUALITY
		});
	};
	
	var stopGrabbing = function() {
		camelot && camelot.stop();
	};
	
	var getFrames = function() {
		return frames;
	};
	
	var getLastFrame = function() {
		return frames[frames.length - 1];
	};
	
	return {
		init : init,
		startGrabbing : startGrabbing,
		stopGrabbing : stopGrabbing,
		getFrames : getFrames,
		getLastFrame : getLastFrame
	};
})();

exports.frameGrabber = frameGrabber;
exports.frame = frame;
