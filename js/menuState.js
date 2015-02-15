var TitleAngularVelocity = -0.01;
var CreditsAngularVelocity = -0.013;
var CreditsAngularVelocity2 = -0.014;
var CreditsAngularVelocity2B = -0.015;
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
		this.creditsAngle2 = 2 * Math.PI/4;
		this.creditsAngle2B = 3 * Math.PI/4;
		this.creditsAngle3 = Math.PI/4;
		this.creditsAngle4 = Math.PI/4;

		this.start_sound = new Howl({
			src: ['sounds/Tripple_blip.wav'],
			volume: 0.5,
		});
	},

	handleInputs: function(input) {
		// Metrics toggle
		if (input.isPressed("one")){
			this.game.canvas.showMetrics = !this.game.canvas.showMetrics;
		}

		if (input.isPressed("spacebar") || input.isPressed("touchThrust") || input.isPressed("touchFire")){
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
		this.creditsAngle2B += CreditsAngularVelocity2B * paceFactor;
		this.creditsAngle3 += CreditsAngularVelocity3 * paceFactor;
		this.creditsAngle4 += CreditsAngularVelocity4 * paceFactor;
	},

	render: function(ctx) {
		ctx.clearAll();
		var title_x = 160;
		var title_y = 150;
		var title_step = 5;

		// Font Test
		//ctx.vectorText("!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
		//	2.5, 30, 30, null, Colors.MAGENTA);
		//ctx.vectorText("Unimplemented:{|}~",
		//	2.5, 30, 55, null, Colors.MAGENTA);

		for(var angle = 0; angle < Math.PI + 0.1; angle+=Math.PI){
			ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle + angle, 300, Colors.MAGENTA);
			ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle-0.01 + angle, 297, Colors.CYAN);
		}

		ctx.vectorTextArc("VERSION 5.1",
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle3, 100, Colors.GREEN);
		var startText;
		var controlsText;
		if (!this.game.browserSupportsTouch){
			startText = "PUSH SPACE TO START";
			controlsText = "Z TO THRUST        SPACE TO SHOOT";
			this.game.thrustPrompt = "PRESS Z TO THRUST";
			this.game.shootPrompt = "PRESS SPACE TO SHOOT";
		} else {
			startText = "TAP ANYWHERE TO START";
			//              #########################################
			controlsText = "TAP LEFT TO THRUST   TAP RIGHT TO SHOOT";
			this.game.thrustPrompt = "TAP LEFT TO THRUST";
			this.game.shootPrompt = "TAP RIGHT TO SHOOT";
		}
		ctx.vectorTextArc(startText,
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle3 + 270*Math.PI/360, 100, Colors.CYAN);
		ctx.vectorTextArc(controlsText,
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle4, 80, Colors.YELLOW);

		ctx.vectorTextArc(
			"WRITTEN BY TRAYTON MOYER (FLOATIN' HEAD) AND ERIC MOYER (FIENDFODDER) FOR LUDAM MINI DARE 56",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle , 240, Colors.GREEN);
		ctx.vectorTextArc(
			"BASED ON THE ASTEROIDS VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2 , 220, Colors.GREEN);
		ctx.vectorTextArc(
			"MUSIC ROUNDABOUT 8 BIT BY STUDIO MEGAANE",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2B , 200, Colors.GREEN);

		this.vortex.draw(ctx);
	}

});