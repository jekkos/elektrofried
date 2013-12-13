// main.js begins
require(
  {
    baseUrl: 'js/',
    packages: [{
        name: 'physicsjs',
        location: 'physicsjs',
        main: 'physicsjs-0.5.3.min'
      }]
  },
  [
  'require',
  'input',
  
  // official modules
  'physicsjs/renderers/canvas',
  'physicsjs/bodies/circle',
  'physicsjs/bodies/convex-polygon',
  'physicsjs/behaviors/newtonian',
  'physicsjs/behaviors/sweep-prune',
  'physicsjs/behaviors/body-collision-detection',
  'physicsjs/behaviors/body-impulse-response'
], function(
  require,
  input,
  Physics
){
  document.body.className = 'before-game';
  var inGame = false;
  document.addEventListener('keydown', function( e ){
    
    if (!inGame && e.keyCode === 90){
      document.body.className = 'in-game';
      inGame = true;
      newGame();
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
  
  window.addEventListener('resize', function(){
    renderer.el.width = parent.innerWidth;
    renderer.el.height = parent.innerHeight;
  });
  var ship;
  var init = function init( world, Physics ){
  
    ship = Physics.body('circle', {
      x: 400,
      y: 100,
      vx: 0.08,
      radius: 15
    });
    
    // bodies
    var planet = Physics.body('circle', {
      // fixed: true,
      // hidden: true,
      mass: 10000,
      radius: 140,
      x: parent.innerWidth / 2,
      y: parent.innerHeight / 2
    });
    planet.view = new Image();
    planet.view.src = require.toUrl('../img/planet.png');
    
    // render on every step
    world.subscribe('step', function(){
      world.render();
    });
    
    // add things to the world
    world.add([
      ship,
      planet,
      Physics.behavior('newtonian', { strength: 1e-4 }),
      Physics.behavior('sweep-prune'),
      Physics.behavior('body-collision-detection'),
      Physics.behavior('body-impulse-response'),
      renderer
    ]);
  };
  
  var world = null;
  var newGame = function newGame(){
    
    if (world){
      world.destroy();
    }
    
    world = Physics( init );
    world.subscribe('lose-game', function(){
      document.body.className = 'lose-game';
      inGame = false;
    });
    world.subscribe('win-game', function(){
      world.pause();
      document.body.className = 'win-game';
      inGame = false;
    });
    world.subscribe('collisions:detected', function(collisions) {
    	console.log("collision detected" + collisions);
    });
  };
  
  function handleInput(dt) {
		if(input.isDown('DOWN') || input.isDown('s')) {
			ship.state.vel[0] += 0.1;
			ship.state.vel[1] += 0.1;

			console.log('down');
		}
		
		if(input.isDown('UP') || input.isDown('w')) {
			ship.state.vel[0] -= 0.1;
			ship.state.vel[1] -= 0.1;
			console.log('up');
		}
  }
  
  // subscribe to ticker and start looping
  Physics.util.ticker.subscribe(function( time ){
    if (world){
      handleInput( time );
      world.step( time ); 
    }
  }).start();
});


