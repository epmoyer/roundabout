var AsteroidSize = 8;

var GameState = State.extend({

	init: function(game) {
		this._super(game);
		
		this.canvasWidth = game.canvas.ctx.width;
		this.canvasHeight = game.canvas.ctx.height;

		this.ship = new Ship(Points.SHIP, Points.FLAMES, 2, 0, 0);
		this.ship.maxX = this.canvasWidth;
		this.ship.maxY = this.canvasHeight;

		this.ship2 = new Ship(Points.SHIPB, Points.FLAMES, 2, 0, 0);
		this.ship2.maxX = this.canvasWidth;
		this.ship2.maxY = this.canvasHeight;
		this.ship2.rotate(Math.PI/2, true); // temp: correct polygon orientation
		this.ship2.rotate(-Math.PI);

		this.stars = [];

		this.gameOver = false;
		this.lives = 3;
		this.lives2 = 3;
		this.lifepolygon = new Polygon(Points.SHIP);
		this.lifepolygon.scale(1.5);
		this.lifepolygon.rotate(-Math.PI/2);
		this.lifepolygon2 = new Polygon(Points.SHIPB);
		this.lifepolygon2.scale(1.5);
		//this.lifepolygon.2rotate(-Math.PI/2);

		this.score = 0;

		this.lvl = 0;

		this.generateLvl();
	},

	generateLvl: function() {
		var num_asteroids = this.lvl+3; //Math.round(Math.pow(((this.lvl + 5)/10), 2) + 3);

		var margin = 20;

		this.ship.x = margin;
		this.ship.y = this.canvasHeight/2;
		this.ship.vel = {
					x: 0,
					y: 0
				}

		this.ship2.x = this.canvasWidth - margin;
		this.ship2.y = this.canvasHeight/2;
		this.ship2.vel = {
					x: 0,
					y: 0
				}

		this.bullets = [];
		for (var i=0; i<50; i++){
			this.stars.push(Math.random() * this.canvasWidth);
			this.stars.push(Math.random() * this.canvasHeight);
		}
		/*
		this.asteroids = [];
		for (var i=0; i<num_asteroids; i++){
			var n = Math.round(Math.random() * (Points.ASTEROIDS.length - 1));

			var x = 0, y=0;
			if (Math.random() > 0.5){
				x = Math.random() * this.canvasWidth;
			} else {
				y = Math.random() * this.canvasHeight;
			}

			var aster = new Asteroid(Points.ASTEROIDS[n], AsteroidSize, x, y);
			aster.maxX = this.canvasWidth;
			aster.maxY = this.canvasHeight;

			this.asteroids.push(aster);
		}
		*/

	},

	handleInputs: function(input) {

		if(this.lives == 0 || this.lives2 ==0){
			this.game.nextState = States.END;
			this.game.stateVars.score = this.score;
			return;
		}
		/*
		if(!this.ship.visible){
			if (input.isPressed("spacebar")){
				if (this.gameOver){
					this.game.nextState = States.END;
					this.game.stateVars.score = this.score;
					return;
				}
				this.ship.visible = true;
			}
			return;
		}
		*/

		if (input.isDown("right")){
			this.ship.rotate(0.07);
		}
		if (input.isDown("left")){
			this.ship.rotate(-0.07);
		}
		if (input.isDown("up")){
			this.ship.addVel();
		}
		if (input.isPressed("spacebar")){
			this.bullets.push(this.ship.shoot());
		}


		if (input.isDown("d")){
			this.ship2.rotate(0.07);
		}
		if (input.isDown("a")){
			this.ship2.rotate(-0.07);
		}
		if (input.isDown("s")){
			this.ship2.addVel();
		}
		if (input.isPressed("w")){
			this.bullets.push(this.ship2.shoot());
		}

	},

	update: function() {
		/*
		for (var i=0, len=this.asteroids.length; i < len; i++){
			var a = this.asteroids[i];
			a.update();

			if (this.ship.collide(a)) {
				this.ship.x  = this.canvasWidth / 2;
				this.ship.y = this.canvasHeight / 2;
				this.ship.vel = {
					x: 0,
					y: 0
				}
				this.lives--;
				if(this.lives <= 0){
					this.gameOver = true;
				}
				this.ship.visible = false;
			}

			for(var j=0, len2 = this.bullets.length; j<len2; j++){
				var b = this.bullets[j];
				if (a.hasPoint(b.x, b.y)){
					this.bullets.splice(j, 1);
					len2--;
					j--;

					switch(a.size){
						case AsteroidSize:
							this.score += 20;
						case AsteroidSize/2:
							this.score += 50;
						case AsteroidSize/4:
							this.score += 100;
					}
					

					// If asteroid is big enough to split
					if (a.size > AsteroidSize/4){
						// create 2 new asteroids
						for(var k=0; k<2; k++){

							var n = Math.round(Math.random() * (Points.ASTEROIDS.length - 1));

							var aster = new Asteroid(Points.ASTEROIDS[n], a.size/2, a.x, a.y);
							aster.maxX = this.canvasWidth;
							aster.maxY = this.canvasHeight;

							this.asteroids.push(aster);
							len++;
						}
					} 
					this.asteroids.splice(i, 1);
					len--;
					i--;
				}
			}
		}
		*/

		// Check bullet collisions
		for(var j=0, len2 = this.bullets.length; j<len2; j++){
			var b = this.bullets[j];
			if (this.ship.hasPoint(b.x, b.y)){
				//this.ship.visible = false;
				this.lives--;
				this.generateLvl();
				return;
			}
			if (this.ship2.hasPoint(b.x, b.y)){
				//this.ship2.visible = false;
				this.lives2--;
				this.generateLvl();
				return;
			}
		}


		// Update bullets
		for (var i=0, len=this.bullets.length; i < len; i++){
			var b = this.bullets[i];
			b.update();

			if(b.shallRemove) {
				this.bullets.splice(i, 1);
				len--;
				i--;
			}
		}

		// Update ship
		this.ship.update();
		this.ship2.update();

		// End of level
		/*
		if(this.asteroids.length == 0){
			this.lvl++;
			this.generateLvl();
		}
		*/
	},

	render: function(ctx){
		ctx.clearAll();

		//ctx.vectorText(this.score, 3, 35, 15);
		//ctx.vectorText(this.game.canvas.ctx.fps, 2, 35, 30);
		ctx.drawFpsGague(this.canvasWidth-40, this.canvasHeight-10);

		for(var i=0; i<this.lives; i++){
			ctx.drawPolygon(this.lifepolygon, 40+15*i, 20);
		}
		for(var i=0; i<this.lives2; i++){
			ctx.drawPolygon(this.lifepolygon2, this.canvasWidth-80+15*i, 20);
		}
		ctx.fillStyle="#808080";
		for(var i=0, len=this.stars.length; i<len; i+=2){
			//console.log(this.stars[i]);
			ctx.fillRect(this.stars[i],this.stars[i+1],2,2);
		}
		/*
		for (var i=0, len=this.asteroids.length; i < len; i++){
			this.asteroids[i].draw(ctx);
		}
		*/
		for (var i=0, len=this.bullets.length; i < len; i++){
			this.bullets[i].draw(ctx);
		}

		if(this.gameOver){
			ctx.vectorText("Game Over", 4, null, null);
		} 

		this.ship.draw(ctx);
		this.ship2.draw(ctx);
	}
})