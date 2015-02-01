var MenuState = State.extend({

	init: function(game){
		this.game = game;

		this.canvasWidth = game.canvas.ctx.width;
		this.canvasHeight = game.canvas.ctx.height;

		/*
		var num_asteroids = Math.random()*5 + 5;

		this.asteroids = [];
		for (var i=0; i<num_asteroids; i++){
			var n = Math.round(Math.random() * (Points.ASTEROIDS.length - 1));

			var x = Math.random() * this.canvasWidth;
			var y = Math.random() * this.canvasHeight;

			var s = [1, 2, 4][Math.round(Math.random() * 2)];

			var aster = new Asteroid(Points.ASTEROIDS[n], AsteroidSize/s, x, y);
			aster.maxX = this.canvasWidth;
			aster.maxY = this.canvasHeight;

			this.asteroids.push(aster);
		}
		*/
	},

	handleInputs: function(input) {
		if (input.isPressed("spacebar")){
			this.game.nextState = States.GAME;
		}
	},

	update: function() {
		/*
		for (var i=0, len=this.asteroids.length; i < len; i++){
			var a = this.asteroids[i];
			a.update();
		}
		*/
	},

	render: function(ctx) {
		ctx.clearAll();
		ctx.vectorText("ROUNDABOUT", 6, null, 180);
		ctx.vectorText("PUSH SPACE TO PLAY", 2, null, 260);
		/*
		for (var i=0, len=this.asteroids.length; i < len; i++){
			this.asteroids[i].draw(ctx);
		}
		*/
	}

});