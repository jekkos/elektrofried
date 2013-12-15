var gm = require('gm');
var logger = require('winston');

exports.build = (function() {
	
	var calcCoordinates = function(dimensions) {
		var result = [];
		console.log('building result ' + dimensions);
		for (var j = 0; j < dimensions.y; j++) {
			for (var i = 0; i < dimensions.x; i++) {
				result.push('+' + i * dimensions.width + '+' + j * dimensions.height);
			}
		}
		return result;
	};
	
	return function(filePath, frames, dimensions) {
		
		var coordinates = calcCoordinates(dimensions);
		console.log(coordinates);
		var tiledImage = gm();
		var tileSize = dimensions.x * dimensions.y;
		if (frames.length >= tileSize ) {
			frames = frames.slice(frames.length - tileSize);
		}
		for (var i = 0; i < frames.length; i++) {
			var frame = frames[i];
			var coordinate = coordinates[i];
			tiledImage.in('-page', coordinate).in(frame.getPath());
			console.log("coord" + coordinate);
		}
		tiledImage.minify()  // Halves the size, 512x512 -> 256x256
		.mosaic()  // Merges the images as a matrix
		.write(filePath, function (err) {
			err && logger.error(err);
		});
	};
	
})();