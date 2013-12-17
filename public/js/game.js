// main.js begins
require(
  {
    baseUrl: 'js/',
    packages: [{
        name: 'physicsjs',
        location: 'physicsjs',
        main: 'physicsjs-full-0.5.3'
      }],
  	 paths: {
       "jquery": "bower/jquery/jquery",
       "socketio": "bower/socket.io-client/dist/socket.io"
  	 }
  },
  [
  'require',
  'input',
  'jquery', 
  'socketio',
  // official modules
  'physicsjs/renderers/canvas',
  'physicsjs/bodies/circle',
  'physicsjs/behaviors/sweep-prune',
  'physicsjs/behaviors/body-collision-detection',
  'physicsjs/behaviors/body-impulse-response',
  'physicsjs/behaviors/edge-collision-detection'
], function(
  require,
  input,
  $,
  socketio,
  Physics
){
  document.body.className = 'before-game';
  var inGame = false;
  var world = null;
  var controller1, controller2;
  var socket = io.connect('http://localhost:8080');
  var width = 800;
  var height = 400;
  
  var score = 0;
  var timeStarted = 0;
  var bounces = 0;
  
  var ball;

  var renderer = Physics.renderer('canvas', {
    el: 'viewport',
    width: width,
    height: height,
    meta: false,
    // debug:true,
    styles: {
      'circle': {
        strokeStyle: 'rgb(0, 30, 0)',
        lineWidth: 1,
        fillStyle: 'rgb(100, 200, 50)',
        angleIndicator: false
      }
    }
  });

  var buildController1 = function() {
	  return buildController(0);
  };
  
  var buildController2 = function() {
	  return buildController(width / 2);
  };
  
  var buildController = function(offset) {
    // bodies
    var controller = Physics.body('circle', {
      fixed: true,
      // hidden: true,
      // mass: 10000,
      radius: 40,
      x: offset + width / 2,
      y: (height - 140 ),
      restitution: 1,
      cof: 0,
      added : true
    });
    //controller.view = new Image();
    //controller.view.src = require.toUrl('../img/planet-50.png');
    return controller;
  };
  
  var init = function init( world, Physics ){
  
	ball = Physics.body('circle', {
      x: 100,
      y: 100,
      vx: 0.09,
      vy: 0.09,
      radius: 15,
      restitution: 1,
      cof : 0
    });
    
    // render on every step
    world.subscribe('step', function(){
      world.render();
    });
    
    controller1 = buildController1();
    controller2 = buildController2();
    
    // add things to the world
    world.add([
      ball,
      controller1,
      controller2,
      //Physics.behavior('newtonian', { strength: 0.0001 }),
      Physics.behavior('sweep-prune'),
      Physics.behavior('body-impulse-response'),
      Physics.integrator('verlet'),
      Physics.behavior('edge-collision-detection', {
          aabb: Physics.aabb(0, 0, width, height),
          restitution: 1.02,
          cof: 0
      }),
      renderer
    ]);
    world.add(Physics.behavior('body-collision-detection'), {
    	checkAll : true
    });
  };
  
  function drawScore() {
	if (inGame) {
		var secondsPlaying = new Date().getSeconds() - timeStarted; 
		score = secondsPlaying * 100 + bounces * 20;
		$("#floating-score").text("Score: " + score);
		console.log("new score found " + score);
	}
  };
  
  var newGame = function newGame() {
	score = 0;
	bounces = 0;
	timeStarted = new Date().getSeconds();
    
	world && world.destroy();
    if ($("#floating-score").length === 0) {
    	$("<div />").attr("id","floating-score").text("Score: " + score).appendTo($("body"));	
    }
    
    world = Physics( {
        // set the timestep
        timestep: 1000.0 / 100,
        // maximum number of iterations per step
        maxIPF: 16,
        // set the integrator (may also be set with world.add())
        integrator: 'verlet'
    }, init );
    
    world.subscribe('game-stopped', function(){
      document.body.className = 'lose-game';
      $("<div />").attr("id","score").text("Score: " + score).appendTo($("body.wrapper"));
    });
    
    world.subscribe('collision-pair', function( data ){
    	inGame = false;
    	// flash the screen when elektrocuting
        $("body").animate({ backgroundColor: "white" }, "fast");
        
    	socket.emit("game-stopped", {
    		score : score
    	});
    	
    	// TODO hide/show div with canvas...
    	socket.on("pic-tweeted", function(data) {
		    var image = new Image();
		    image.addEventListener('load', function() {
	    	  var width = image.naturalWidth; // this will be 300
	    	  var height = image.naturalHeight; // this will be 400
 			  $("canvas").getContext("2d").drawImage(image, 0, 0, width, height);
		}, false);
		    //$('body').css("background-image", "url("  + data.url + ")");  
    	});
    	
    	world.publish({
    		topic: 'game-stopped'
    	});
    	
    });
    
 // custom view creation
    world.subscribe('render', function( data ) {
    	var getColor = function(r, g, b) {
    		return {
    			strokeStyle: 'rgb(60, 0, 0)',
    			lineWidth: 1,
    			fillStyle: 'rgb(' + r + ', ' + g + ', ' + b + ')',
    			angleIndicator: false
    		};
    	};
    	controller1.view = data.renderer.createView(controller1.geometry, getColor(255, 0, 0));
    	controller2.view = data.renderer.createView(controller2.geometry, getColor(255, 255, 0));
    	ball.view = data.renderer.createView(ball.geometry, getColor(0, 0, 255));
    	// only run once
        world.unsubscribe( data.topic, data.handler );

    }, null, 100);

    
    world.subscribe('collisions:detected', function(data) {
    	
    	function hasCollided(data) {
    		return c.bodyA === controller1 ||
    		 	c.bodyB == controller1 ||
    		 	c.bodyA == controller2 ||
    		 	c.bodyB == controller2;
    	}
    	var c, boundaryHit = true;
	    for (var i = 0, l = data.collisions.length; i < l; i++){
	        c = data.collisions[ i ];
	        if (hasCollided(data)) {
	        	boundaryHit = false;
	        	inGame = false;
	        	// flash the screen when elektrocuting
	            $("body").animate({ backgroundColor: "white" }, "fast");
	            
	        	socket.emit("game-stopped", {
	        		score : score
	        	});
	        	
	        	// TODO hide/show div with canvas...
	        	socket.on("pic-tweeted", function(data) {
	    		    var image = new Image();
	    		    image.addEventListener('load', function() {
	    	    	  var width = image.naturalWidth; // this will be 300
	    	    	  var height = image.naturalHeight; // this will be 400
	     			  $("canvas").getContext("2d").drawImage(image, 0, 0, width, height);
	    		}, false);
	    		    //$('body').css("background-image", "url("  + data.url + ")");  
	        	});
	        	
	        	world.publish({
	        		topic: 'game-stopped'
	        	});
	        	/*world.publish({
	        		topic: 'collision-pair',
	        		bodyA: c.bodyA,
	        		bodyB: c.bodyB
	        	});*/
	        }
	    }
	    boundaryHit && inGame && bounces++ && drawScore();
    });
    
  };
  
  var handleInput = function(event, key) {
	  
	  if (inGame) {
		  if (key === "UP") {
			  console.log("UP " + event.shiftKey);
			  if (event.shiftKey) {
				  world.removeBody(controller1);
				  controller1.added = false;
			  } else {
				  world.removeBody(controller2);
				  controller2.added = false;
			  }
		  } else if (key === "DOWN") {
			  console.log("DOWN " + event.shiftKey);
			  if (event.shiftKey && !controller1.added) {
				  world.addBody(controller1);
				  controller1.recalc();
			  } else if (!controller2.added) {
				  world.addBody(controller2);
				  controller2.recalc();
			  }
		  }
	  } else if (event.shiftKey && "DOWN" === key) {
		  document.body.className = 'in-game';
	      inGame = true;
	      newGame();
	      socket.emit("game-started", {
	    	  frequency : 1
	      });
	  }
  };

  window.addEventListener("keypress", function(event) {
      var key = input.getKeyCode(event);
      handleInput(event, key);
  }, false);
  
  $(document).keydown(function(event) {
	  var key = input.getKeyCode(event);
      handleInput(event, key);
  });
  

  // subscribe to ticker and start looping
  Physics.util.ticker.subscribe(function( time ){
    if (world && inGame){
      world.step( time ); 
    }
  }).start();
});


 