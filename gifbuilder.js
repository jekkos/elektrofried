var Buffer = require('buffer').Buffer;
var fs = require('fs');
var sys = require('sys');
var gif = require('gif');

exports.build = (function() {
	
	var FRAME_SIZE = 3;
	
	return function(filePath, frames, dimensions, callback) {
		// pop last three images from the stack
		// push them into an animated gif
		var animatedGif = new gif.AsyncAnimatedGif(dimensions.width, dimensions.height);
		animatedGif.setTmpDir('/tmp');
		animatedGif.setOutputFile(filePath);

		for (var i = frames.length-1;i > -1; i--) {
			var frame = frames[i];
			var rgb = fs.readFileSync(frame.getPath()); // returns buffer
			animatedGif.push(rgb, 0, 0, dimensions.width, dimensions.height);
			animatedGif.endPush();
		}
		// add images
		animatedGif.encode(callback);
	};
	
})();