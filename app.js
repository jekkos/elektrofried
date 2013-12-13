var Camelot = require('camelot'), events = require('events');
var server = require('http').Server(), io = require('socket.io').listen(8080);
var logger = require('winston');
var twitterer = require('./twitterer');

exports.app = (function() {
	
	sockets = [];
	
	var camelot = new Camelot( {
		'device' : '/dev/video0',
		'input' : 0,
		'skip' : 1,
		'resolution' : '640x480',
		'controls' : {
			brightness : 2,
			contrast : 3,
			saturation : 3,
			hue : 0,
			sharpness : 9,
			gamma : 1
		}
	});
	
	camelot.on('frame', function (file) {
		logger.info('frame received!');
		for (var i = 0; i < sockets.length; i++) {
			sockets[i].emit("frame", file);
			twitterer.upload(file, "twitpic", "NEW HIGH SCOR!");
		}
	});
	
	camelot.on('error', function (err) {
		logger.error(err.toString());
	});
	
	io.on('connection', function(socket) {
		sockets.push(socket);
		logger.info('socket opened!');
		socket.on('disconnect', function() {
			sockets.splice(sockets.indexOf(socket), 1);
		});
		socket.on('grab', function(data) {
			camelot.grab( {
				'frequency' : data.frequency,
				'jpeg' : data.quality || 8
			});
		});
	});
	
	
	return this;
})();
