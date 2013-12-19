// main.js begins
require({
	baseUrl : 'js/',
	packages : [ {
		name : 'physicsjs',
		location : 'physicsjs',
		main : 'physicsjs-full-0.5.3'
	} ],
	paths : {
		"jquery" : "bower/jquery/jquery",
		// "bootstrap" : "bower/bootstrap/dist/js/bootstrap",
		"socketio" : "bower/socket.io-client/dist/socket.io"
	}
}, [ 'require', 'input', 'jquery', 'socketio',
// official modules
'physicsjs/renderers/canvas', 'physicsjs/bodies/circle',
		'physicsjs/behaviors/sweep-prune',
		'physicsjs/behaviors/body-collision-detection',
		'physicsjs/behaviors/body-impulse-response',
		'physicsjs/behaviors/edge-collision-detection',
// 'bootstrap'
], function(require, input, $, socketio, Physics) {
	document.body.className = 'before-game';
	var inGame = false;
	var gameEnabled = true;
	var world = null;
	var controller1, controller2;
	var socket = io.connect('http://localhost:8080');
	var width = 800;
	var height = 400;

	var score = 0;
	var timeStarted = 0;
	var bounces = 0;

	var ball;

	var collisionBehavior;

	var renderer = Physics.renderer('canvas', {
		el : 'viewport',
		width : width,
		height : height,
		meta : false,
		// debug:true,
		styles : {
			'circle' : {
				strokeStyle : 'rgb(0, 30, 0)',
				lineWidth : 1,
				fillStyle : 'rgb(100, 200, 50)',
				angleIndicator : false
			}
		}
	});

	var buildController = function(first) {
		// bodies
		var controller = Physics.body('circle', {
			radius : 40,
			vx : 0,
			vy : 0,
			x : (first ? 0.6 : 0.3) * width,
			y : (first ? 0.3 : 0.6) * height,
			restitution : 1,
			cof : 0
		});
		// controller.view = new Image();
		// controller.view.src = require.toUrl('../img/planet-50.png');
		return controller;
	};

	var init = function init(world, Physics) {

		ball = Physics.body('circle', {
			x : 50,
			y : 400,
			vx : 0.1,
			vy : -0.1,
			radius : 15,
			restitution : 1,
			cof : 0
		});

		// render on every step
		world.subscribe('step', function() {
			world.render();
		});

		controller1 = buildController(true);
		controller2 = buildController(false);

		// add things to the world
		world.add([ ball, controller1, controller2,
		// Physics.behavior('newtonian', { strength: 0.0001 }),
		Physics.behavior('sweep-prune'),
				Physics.behavior('body-impulse-response'),
				Physics.integrator('verlet'),
				Physics.behavior('edge-collision-detection', {
					aabb : Physics.aabb(0, 0, width, height),
					restitution : 1.02,
					cof : 0
				}), renderer ]);
		collisionBehavior = Physics.behavior('body-collision-detection', {
			checkAll : true
		});
		world.add(collisionBehavior);
	};

	function drawScore() {
		if (inGame) {
			var secondsPlaying = Math.abs(new Date().getSeconds() - timeStarted);
			score = secondsPlaying * 100 + bounces * 20;
			$("#floating-score").text("Score: " + score);
			console.log("new score found " + score);
		}
	}

	// setup communication
	$("#submit-tweet").click(function() {
		socket.emit("tweet", {
			name : $("#name-input").val(),
			email : $("#email-input").val(),
			message : $("#tweet-input").val()
		});
		$("#tiled-image-overlay").hide(1000, function() {
			$("#game-start-overlay").show(500);
			gameEnabled = true;
		});
		return false;
	});

	socket.on('input-received', function(status) {
		console.log(" ipnut received " + JSON.stringify(status));
		handleInput(status);
	});

	socket.on("options", function(options) {
		console.log("options received " + JSON.stringify(options));
		$("#tweet-input").val(options.message);
	});

	var stopGame = function() {
		inGame = false;
		gameEnabled = false;
		socket.on('tile-built', function(data) {
			if (!inGame) {
				console.log("tile received: " + JSON.stringify(data));
				var img = $("<img />", {
					src : data.url
				});
				$("#active-item").empty().append(img);
				$("#tiled-image-overlay").show(1000);
			}
		});

		socket.emit("game-stopped", {
			score : score
		});

		document.body.className = 'lose-game';
	};

	var startGame = function newGame() {
		inGame = true;
		score = 0;
		bounces = 0;
		timeStarted = new Date().getSeconds();

		world && world.destroy();
		if ($("#floating-score").length === 0) {
			$("<div />").attr("id", "floating-score").text("Score: " + score)
					.appendTo($("body"));
		}

		world = Physics({
			// set the timestep
			timestep : 1000.0 / 100,
			// maximum number of iterations per step
			maxIPF : 16,
			// set the integrator (may also be set with world.add())
			integrator : 'verlet'
		}, init);

		/*
		 * world.subscribe('collision-pair', function( data ){ inGame = false;
		 * 
		 * socket.emit("game-stopped", { score : score });
		 * 
		 * socket.on("pic-tweeted", function(data) { $("#tile").attr("src",
		 * data.url).load(function() { $("#game-over").show(); }); });
		 * 
		 * world.publish({ topic: 'game-stopped' });
		 * 
		 * });
		 */

		socket.emit("game-started", {
			frequency : 1
		});

		// custom view creation
		world.subscribe('render', function(data) {
			var getColor = function(r, g, b) {
				return {
					strokeStyle : 'rgb(60, 0, 0)',
					lineWidth : 1,
					fillStyle : 'rgb(' + r + ', ' + g + ', ' + b + ')',
					angleIndicator : false
				};
			};
			controller1.view = data.renderer.createView(controller1.geometry,
					getColor(255, 0, 0));
			controller2.view = data.renderer.createView(controller2.geometry,
					getColor(255, 255, 0));
			ball.view = data.renderer.createView(ball.geometry, getColor(0, 0,
					255));
			// only run once
			world.unsubscribe(data.topic, data.handler);

		}, null, 100);

		world.subscribe('collisions:detected', function(data) {

			function hasCollided(data) {
				return c.bodyA === controller1 || c.bodyB == controller1
						|| c.bodyA == controller2 || c.bodyB == controller2;
			}
			var c;
			for (var i = 0, l = data.collisions.length; i < l; i++) {
				c = data.collisions[i];
				if (hasCollided(data)) {
					stopGame();
					return;
					/*
					 * world.publish({ topic: 'collision-pair', bodyA: c.bodyA,
					 * bodyB: c.bodyB });
					 */
				}
			}
			bounces++ && drawScore();
		});

	};

	var addOrRemoveBody = function(func, controller) {
		world.removeBehavior(collisionBehavior);
		func.call(world, controller);
		world.addBehavior(collisionBehavior);
	};

	var handleInput = function(status) {
		var diff = input.statusDiff(status);
		if (inGame) {
			var leftDown = diff.leftDown();
			var rightDown = diff.rightDown();
			if (diff.leftChanged()) {
				console.log("LEFT changed " + leftDown);
				if (leftDown) {
					addOrRemoveBody(world.addBody, controller1);
				} else {
					addOrRemoveBody(world.removeBody, controller1);
				}
			} else if (diff.rightChanged()) {
				console.log("RIGHT changed " + rightDown);
				if (rightDown) {
					addOrRemoveBody(world.addBody, controller2);
				} else {
					addOrRemoveBody(world.removeBody, controller2);
				}
			}
		} else if (diff.bothDown() && gameEnabled) {
			console.log("game started");
			document.body.className = 'in-game';
			$("#game-start-overlay").hide(100);
			startGame();
		}
	};

	/*
	 * $(document).keypress(function(event) { console.log("keypress"); var key =
	 * input.getKeyCode(event); handleInput(event, key); });
	 */

	/*
	 * $(document).keydown(function(event) { console.log("keydown"); if (inGame) {
	 * var key = input.getKeyCode(event); handleInput(event, key); } });
	 */

	// subscribe to ticker and start looping
	Physics.util.ticker.subscribe(function(time) {
		if (world && inGame) {
			world.step(time);
		}
	}).start();
});