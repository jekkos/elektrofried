define(function() {
    var pressedKeys = {};
    var shiftDown = false;
    var oldStatus;

    function setKey(event, status) {
    	var key = getKeyCode(event);
    	pressedKeys[key] = status;
    	shiftDown = event.shiftKey;
    }
    
    var statusDiff = function(newStatus) {
    	var result = {
    		oldStatus : oldStatus,
			leftChanged :  function() {
				return this.oldStatus.links !== newStatus.links;
			},
			rightChanged : function() {
				return this.oldStatus.rechts !== newStatus.rechts;
			},
			leftDown : function() {
				return newStatus.links === "1";
			},
			rightDown : function() {
				return newStatus.rechts === "1";
			},
			bothDown : function() {
				return this.leftDown() && this.rightDown();
			},
			bothUp : function() {
				return !this.leftDown() && !this.rightDown();
			}
		};
    	oldStatus = newStatus;
    	return result;
	};
    
    var getKeyCode = function getKeyCode(event) {
        var code = event.keyCode;
        var key;

        switch(code) {
        case 32:
            key = 'SPACE'; break;
        case 37:
            key = 'LEFT'; break;
        case 38:
            key = 'UP'; break;
        case 39:
            key = 'RIGHT'; break;
        case 40:
            key = 'DOWN'; break;
        default:
            // Convert ASCII codes to letters
            key = String.fromCharCode(code);
        }
        return key;
    };
    
   /* document.addEventListener('keydown', function(e) {
        setKey(e, false);
    });

    document.addEventListener('keyup', function(e) {
        setKey(e, false);
    });
    */
    window.addEventListener('blur', function() {
        pressedKeys = {};
    });

    return {
        isDown: function(key) {
            return pressedKeys[key.toUpperCase()];
        },
        isPressed: function(shift, key) {
        	return pressedKeys[key.toUpperCase()];
        },
        isShiftDown : function() {
        	return shiftDown;
        },
        getKeyCode : getKeyCode,
        statusDiff : statusDiff
    };
});