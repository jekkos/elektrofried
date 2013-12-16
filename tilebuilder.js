var gm = require('gm');
var logger = require('winston');

exports.build = (function() {
	
	var calcCoordinates = function(dimensions) {
		var result = [];
		logger.debug('building result in ' + dimensions.x + 'x' + dimensions.y);
		for (var j = 0; j < dimensions.y; j++) {
			for (var i = 0; i < dimensions.x; i++) {
				result.push('+' + i * dimensions.width + '+' + j * dimensions.height);
			}
		}
		return result;
	};
	
	return function(filePath, frames, dimensions, callback) {
		
		var coordinates = calcCoordinates(dimensions);
		logger.info(JSON.stringify(coordinates) + " writing to " + filePath);
		var tiledImage = gm();
		var tileSize = dimensions.x * dimensions.y;
		if (frames.length >= tileSize ) {
			frames = frames.slice(frames.length - tileSize);
		}
		for (var i = 0; i < frames.length; i++) {
			var frame = frames[i];
			var coordinate = coordinates[i];
			tiledImage.in('-page', coordinate).in(frame.getPath());
		}
		tiledImage.minify()  // Halves the size, 512x512 -> 256x256
		.mosaic()  // Merges the images as a matrix
		.write(filePath, callback);
	};
	
})();