var TitleAngularVelocity = -0.01;
var CreditsAngularVelocity = -0.013;
var CreditsAngularVelocity2 = -0.014;
var CreditsAngularVelocity3 = -0.020;
var CreditsAngularVelocity4 = -0.027;

var MenuState = State.extend({

	init: function(game){
		this.game = game;

		this.canvasWidth = game.canvas.ctx.width;
		this.canvasHeight = game.canvas.ctx.height;

		this.vortex = new Vortex(this.canvasWidth/2, this.canvasHeight/2);
		this.vortex.shieldActive = false;

		this.titleAngle = (Math.PI*2) * (210/360);
		this.creditsAngle = 0;
		this.creditsAngle2 = Math.PI/4;
		this.creditsAngle3 = Math.PI/4;
		this.creditsAngle4 = Math.PI/4;

		this.start_sound = new Howl({
			urls: ['sounds/Tripple_blip.wav'],
			volume: 0.5,
		});
	},

	handleInputs: function(input) {
		// Metrics toggle
		if (input.isPressed("one")){
			this.game.canvas.showMetrics = !this.game.canvas.showMetrics;
		}

		if (input.isPressed("spacebar")){
			this.game.nextState = States.GAME;
			this.start_sound.play();
		}
	},

	update: function(paceFactor) {
		// Update vortex
		this.vortex.update(paceFactor);
		this.titleAngle += TitleAngularVelocity * paceFactor;
		this.creditsAngle += CreditsAngularVelocity * paceFactor;
		this.creditsAngle2 += CreditsAngularVelocity2 * paceFactor;
		this.creditsAngle3 += CreditsAngularVelocity3 * paceFactor;
		this.creditsAngle4 += CreditsAngularVelocity4 * paceFactor;
	},

	render: function(ctx) {
		ctx.clearAll();
		var title_x = 160;
		var title_y = 150;
		var title_step = 5;
		// ctx.vectorText("ROUNDABOUT", 12, title_x, title_y, null, Colors.MAGENTA);
		// ctx.vectorText("ROUNDABOUT", 11.9, title_x + 3, title_y + title_step, null, Colors.CYAN);
		for(var angle = 0; angle < Math.PI + 0.1; angle+=Math.PI){
			ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle + angle, 300, Colors.MAGENTA);
			ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle-0.01 + angle, 297, Colors.CYAN);
		}
		
		// ctx.vectorText("PUSH SPACE TO PLAY", 2, null, 460, null, Colors.CYAN);
		// ctx.vectorText("Z TO THRUST", 2, null, 480, null, Colors.YELLOW);
		// ctx.vectorText("SPACE TO SHOOT", 2, null, 500, null, Colors.YELLOW);

		// ctx.vectorText("VERSION 5", 2, null, 290, null, Colors.GREEN);


		// ctx.vectorTextArc("VERSION 5",
		// 	2, this.vortex.center_x, this.vortex.center_y,
		// 	(Math.PI*2) * (235/360), 80, Colors.GREEN);
		// ctx.vectorTextArc("PUSH SPACE TO PLAY",
		// 	2, this.vortex.center_x, this.vortex.center_y,
		// 	(Math.PI*2) * (20/360), 80, Colors.CYAN);

		ctx.vectorTextArc("VERSION 5",
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle3, 100, Colors.GREEN);
		ctx.vectorTextArc("PUSH SPACE TO PLAY",
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle3 + 270*Math.PI/360, 100, Colors.CYAN);

		ctx.vectorTextArc("Z TO THRUST        SPACE TO SHOOT",
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle4, 80, Colors.YELLOW);

		// ctx.vectorText("WRITTEN BY TRAYTON MOYER AND ERIC MOYER FOR LUDAM MINI DARE 56", 2, null, 680, null, Colors.GREEN);
		// ctx.vectorText("MUSIC ROUNDABOUT 8 BIT BY STUDIO MEGAANE", 2, null, 700, null, Colors.GREEN);
		// ctx.vectorText("VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG", 2, null, 720, null, Colors.GREEN);

		ctx.vectorTextArc(
			"WRITTEN BY TRAYTON MOYER AND ERIC MOYER FOR LUDAM MINI DARE 56" +
			"            MUSIC ROUNDABOUT 8 BIT BY STUDIO MEGAANE",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle , 240, Colors.GREEN);
		ctx.vectorTextArc(
			"BASED ON THE ASTEROIDS VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2 , 220, Colors.GREEN);

		this.vortex.draw(ctx);
	}

});