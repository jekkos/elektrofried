var config = require('./config');
var SerialPort = require('serialport').SerialPort;
var serialport = require('serialport');
var logger = require('winston');

// singleton object!

var serialConnector = (function() {

	var serialOpened = false;
	var gameStarted = false;
	var serialPort;
	
	var isInitialized = function() {
		return serialOpened && serialPort;
	};
	
	var isGameStarted = function() {
		return gameStarted;
	};
	
	var serialWrite = function(command) {
		if (isInitialized()) {
			serialPort.write(command + config.SERIAL_SEPARATOR, function(err) {
				err && logger.error(err);
			});
		}
	};
	
	var shock = function(data) {
		isGameStarted() && serialWrite(config.SHOCK);
	};
	
	var shockIfReleased = function(status) {
		if (isGameStarted()) {
			if (status.links === "0" && status.rechts === "0") {
				logger.warn("controllers " + JSON.stringify(status) + ", emitting shock!");
				serialWrite(config.SHOCK);
			}
		}
	};
	
	var init = function(statusCallback) {
		
		serialPort = new SerialPort(config.TTY_NAME, {
			  parser: serialport.parsers.readline("\r\n"),
			  baudrate: config.BAUD_RATE
		});
		
		serialPort.on("open", function () {
			logger.info('serialport ' +  config.TTY_NAME +  ' opened at ' + config.BAUD_RATE + " bauds");
			var parseStatus = function(data) {
				return {
					links : data.charAt(0),
					rechts : data.charAt(1),
					shock : data.charAt(2),
					mode : data.charAt(3)
				};
			};
			
			serialPort.on('data', function(data) {
				// parse data into object..
				var status = parseStatus(data);
				logger.info('status data received: ' + JSON.stringify(status));
				statusCallback && statusCallback.call(this, status);
				shockIfReleased(status);
			});
			// goto demo mode to show we're ready
			serialWrite(config.DEMO_MODE);
			serialOpened = true;
		});
	};
	
	var startGame = function() {
		gameStarted = true;
		// enable shocks
		serialWrite(config.ENABLE_SHOCK);
		// enable lights
		serialWrite(config.LIGHT_MODE);
	};
	
	var stopGame = function() {
		gameStarted = false;
		// disable shocks
		serialWrite(config.DISABLE_SHOCK);
		// goto demo mode
		serialWrite(config.DEMO_MODE);
	};
	
	return {
		init : init,
		shock : shock,
		startGame : startGame,
		stopGame : stopGame
	};
	
})();

// register status callback here
exports.serialConnector = serialConnector;
