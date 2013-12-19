var common = (function() {
	Object.spawn = function (parent, props) {
		var defs = {}, key;
		for (key in props) {
			if (props.hasOwnProperty(key)) {
				defs[key] = {value: props[key], enumerable: true};
			}
		}
		return Object.create(parent, defs);
	};
	
	if (!String.prototype.format) {
		String.prototype.format = function() {
			var args = arguments;
			return this.replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined'
					? args[number]
				: match
				;
			});
		};
	}
})();
