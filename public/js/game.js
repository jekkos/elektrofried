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
  'physicsjs/bodies/convex-polygon',
  'physicsjs/behaviors/newtonian',
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
  $(document).keypress(function( e ) {
    var keyCode = input.getKeyCode(e);
    if (!inGame && e.shiftKey && "DOWN" === keyCode) {
      document.body.className = 'in-game';
      inGame = true;
      newGame();
      socket.emit("grab", {
    	  frequency : 1
      });
    }
  });
  
  var renderer = Physics.renderer('canvas', {
    el: 'viewport',
    width: parent.innerWidth,
    height: parent.innerHeight,
    // meta: true,
    // debug:true,
    styles: {
      'circle': {
        strokeStyle: 'rgb(0, 30, 0)',
        lineWidth: 1,
        fillStyle: 'rgb(100, 200, 50)',
        angleIndicator: false
      },
      'convex-polygon' : {
        strokeStyle: 'rgb(60, 0, 0)',
        lineWidth: 1,
        fillStyle: 'rgb(60, 16, 11)',
        angleIndicator: false
      }
    }
  });
  
  var $win = $(window)
  ,viewWidth = $win.width()
  ,viewHeight = $win.height()
  ,viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight)
  ,edgeBounce = Physics.behavior('edge-collision-detection', {
      aabb: viewportBounds,
      restitution: 1,
      cof: 0
  })
  ;
  
  $win.on('resize', function(){
    renderer.el.width = parent.innerWidth;
    renderer.el.height = parent.innerHeight;
    viewWidth = $win.width();
    viewHeight = $win.height();
    viewportBounds = Physics.aabb(0, 0, viewWidth, viewHeight);
    edgeBounce.setAABB( viewportBounds );
  }).trigger('resize');
  var ball;
  
  var buildController1 = function() {
	  return buildController(0);
  };
  
  var buildController2 = function() {
	  return buildController(parent.innerWidth / 2);
  };
  
  var buildController = function(offset) {
    // bodies
    var controller = Physics.body('circle', {
      fixed: true,
      // hidden: true,
      // mass: 10000,
      radius: 70,
      x: offset + parent.innerWidth / 2 * Math.random(),
      y: (parent.innerHeight - 140 ) * Math.random()
    });
    controller.view = new Image();
    controller.view.src = require.toUrl('../img/planet-50.png');
    return controller;
  };
  
  var init = function init( world, Physics ){
  
	ball = Physics.body('circle', {
      x: 100,
      y: 100,
      vx: 0.09,
      vy: 0.09,
      radius: 15
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
      Physics.behavior('body-collision-detection'),
      Physics.behavior('body-impulse-response'),
      edgeBounce,
      renderer
    ]);
  };
  
  var score = 0;
  var bounces = 0;
  var timeStarted = 0;
  
  function drawScore() {
	if (inGame) {
		var secondsPlaying = new Date().getSeconds() - timeStarted; 
		score = Math.round(secondsPlaying * 100 + bounces * 20 );
		$("#floating-score").text("Score: " + score);
		console.log("new score found " + score);
	}
  };
  
  var newGame = function newGame() {
	score = 0;
	bounces = 0;
	timeStarted = new Date().getSeconds();
    
    if (world){
      world.destroy();
    }
    if ($("#floating-score").length === 0) {
    	$("<div />").attr("id","floating-score").text("Score: " + score).appendTo($("body"));	
    }
    
    world = Physics( init );
    world.subscribe('lose-game', function(){
      document.body.className = 'lose-game';
      inGame = false;
      $("<div />").attr("id","score").text("Score: " + score).appendTo($("body.wrapper"));
      
    });
    
    // subscribe to collision pair
    world.subscribe('collision-pair', function( data ){
        // data.bodyA; data.bodyB...
    	socket.emit("tweet", {
    		message : 'Brave enough! You have been elektrofied.. Score = ' + score
    	});
    	// show tiled pic...
    	socket.on("tiledpic", function(data) {
		    var img = $("body").attr("style", data.url);		
		    $('body').css("background-image", "url("  + data.url + ")");  
    	});
    	world.publish({
    		topic: 'lose-game'
    	});
    });
    
    world.subscribe('collisions:detected', function(data) {
    	
    	function checkCollision(data) {
    		return c.bodyA === controller1 ||
    		 	c.bodyB == controller1 ||
    		 	c.bodyA == controller2 ||
    		 	c.bodyB == controller2;
    	}
    	// collision-pairdra
    	var boundaryHit = true;
    	var c;
	    for (var i = 0, l = data.collisions.length; i < l; i++){
	        c = data.collisions[ i ];
	        if (checkCollision(data)) {
	        	boundaryHit = false;
	        	world.publish({
	        		topic: 'collision-pair',
	        		bodyA: c.bodyA,
	        		bodyB: c.bodyB
	        	});
	        }
	    }
	    boundaryHit && inGame && bounces++ && drawScore();
	    // add some points to the score
    	// just shock here!
    	// detect event!!
    });
  };
  
  $(document).keypress(function(event) {
	  var handleInput = function(key) {
		  if (inGame) {
			  if (key === "UP") {
				  if (event.shiftKey) {
					  world.removeBody(controller1);
				  } else {
					  world.removeBody(controller2);
				  }
			  } else if (key === "DOWN") {
				  if (event.shiftKey) {
					  world.addBody(controller1);
				  } else {
					  world.addBody(controller2);
				  }
			  }
		  }
	  };
      var key = input.getKeyCode(event);
      handleInput(key);
  });
  

  // subscribe to ticker and start looping
  Physics.util.ticker.subscribe(function( time ){
    if (world){
      drawScore();
      world.step( time ); 
    }
  }).start();
});


 