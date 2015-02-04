var MenuState = State.extend({

	init: function(game){
		this.game = game;

		this.canvasWidth = game.canvas.ctx.width;
		this.canvasHeight = game.canvas.ctx.height;

		this.vortex = new Vortex(this.canvasWidth/2, this.canvasHeight/2);
		this.vortex.shieldActive = false;

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
	},

	render: function(ctx) {
		ctx.clearAll();
		var title_x = 160
		var title_y = 150
		var title_step = 5
		ctx.vectorText("ROUNDABOUT", 12, title_x, title_y, null, Colors.MAGENTA);
		ctx.vectorText("ROUNDABOUT", 11.9, title_x + 3, title_y + title_step, null, Colors.CYAN);
		

		ctx.vectorText("PUSH SPACE TO PLAY", 2, null, 560, null, Colors.CYAN);
		ctx.vectorText("Z TO THRUST", 1, null, 590, null, Colors.YELLOW);
		ctx.vectorText("SPACE TO SHOOT", 1, null, 600, null, Colors.YELLOW);

		ctx.vectorText("VERSION 5", 2, null, 270, null, Colors.GREEN);
		ctx.vectorText("WRITTEN BY TRAYTON MOYER AND ERIC MOYER FOR LUDAM MINI DARE 56", 2, null, 680, null, Colors.GREEN);
		ctx.vectorText("MUSIC ROUNDABOUT 8 BIT BY STUDIO MEGAANE", 2, null, 700, null, Colors.GREEN);
		ctx.vectorText("VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG", 2, null, 720, null, Colors.GREEN);

		this.vortex.draw(ctx);
	}

});