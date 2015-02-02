var ShipStartRadius = 250;
var ShipStartAngle = -Math.PI / 2;

var DrifterMaxRadius = 1024/2+30;
var DrifterSpawnRate = 0.005;
var DrifterPoints = 100;
var DrifterCollisionRadius = 13;

var BulletsMax = 4;

var ExtraLifeScore = 3000;

var GameState = State.extend({

	init: function(game) {
		this._super(game);
		
		this.canvasWidth = game.canvas.ctx.width;
		this.canvasHeight = game.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;

		this.vortex = new Vortex(this.center_x, this.center_y);

		this.ship = new Ship(Points.WIDE_SHIP, Points.FLAMES, 1.5, this.center_x, this.center_y, 
			ShipStartRadius, ShipStartAngle, Colors.YELLOW, this.vortex.radiusToAngularVelocity);
		this.ship.maxX = this.canvasWidth;
		this.ship.maxY = this.canvasHeight;

		this.stars = [];
		for (var i=0; i<200; i++){
			this.stars.push(Math.random() * this.canvasWidth);
			this.stars.push(Math.random() * this.canvasHeight);
		}

		this.gameOver = false;
		this.lives = 3;
		this.lifepolygon = new Polygon(Points.WIDE_SHIP, Colors.YELLOW);
		this.lifepolygon.setScale(1.2);
		this.lifepolygon.setAngle(-Math.PI/2);

		this.score = 0;

		this.lvl = 0;

		this.generateLvl();

		this.engine_sound = new Howl({
			urls: ['sounds/Engine.ogg'], //, 'sounds/Engine.wav'],
			volume: 0.25,
			loop: true,
		});
		this.player_die_sound = new Howl({
			urls: ['sounds/Playerexplosion2.wav'],
			volume: 0.25,
		});
		this.extra_life_sound = new Howl({
			urls: ['sounds/ExtraLife.wav'],
			volume: 1.00,
		});
		this.engine_sound_playing = false;

		this.vortexCollapse = false;

		// Drifters
		this.drifters = [];
	},

	generateLvl: function() {
		var num_asteroids = this.lvl+3; //Math.round(Math.pow(((this.lvl + 5)/10), 2) + 3);

		var margin = 20;

		this.ship.radius = ShipStartRadius;
		this.ship.radialAngle = ShipStartAngle;

		this.bullets = [];
		this.drifters = [];
	},

	addPoints: function(points){
		// Points only count when not dead
		if(this.ship.visible){
			if(Math.floor(this.score / ExtraLifeScore) != Math.floor((this.score + points) / ExtraLifeScore)){
				// Extra life
				this.lives++;
				this.extra_life_sound.play();
			}
			this.score += DrifterPoints;
		}
	},

	handleInputs: function(input) {

		// Metrics toggle
		if (input.isPressed("one")){
			this.game.canvas.showMetrics = !this.game.canvas.showMetrics;
		}

		/*
		if(this.lives == 0){
			this.game.nextState = States.END;
			this.game.stateVars.score = this.score;
			return;
		}*/
		
		if(!this.ship.visible){
			if (input.isPressed("spacebar")){
				if (this.gameOver){
					this.game.nextState = States.END;
					this.game.stateVars.score = this.score;
					return;
				}
			}
			return;
		}


		if (input.isDown("z")){
			this.ship.addVel();
			if(!this.engine_sound_playing){
				this.engine_sound.play();
				this.engine_sound_playing = true;
			}
		} else {
			if (this.engine_sound_playing){
				this.engine_sound.stop();
				this.engine_sound_playing = false;
			}
		}

		if (input.isPressed("spacebar")){
			// Limit max shots on screen 
			if(this.bullets.length < BulletsMax){
				this.bullets.push(this.ship.shoot());
			}
		}

	},

	update: function(paceFactor) {
		if (this.ship.visible){
			if (this.ship.vortexDeath){
				this.engine_sound.stop();
				this.lives--;
				if(this.lives <= 0){
					this.gameOver = true;
				}
				this.ship.visible = false;
				this.ship.vortexDeath = false;
				this.vortexCollapse = true;
				// Make all enemies death dive to clear field
				for(var i=0, len=this.drifters.length; i<len; i++){
					this.drifters[i].deathDive = true;
				}
			}
		}
		else{
			// Respawn after all enmies have cleared the playfield
			if(!this.gameOver){
				if(this.drifters.length == 0){
					this.ship.radius = ShipStartRadius;
					this.ship.radialAngle = ShipStartAngle;
					this.ship.ascentVelocity = 0;
					this.ship.visible = true;
					this.ship.vortexDeath = false;
				}
			}
		}

		// Check bullet collisions
		for(var j=0, len2 = this.bullets.length; j<len2; j++){
			var b = this.bullets[j];
			var bulletRemove = false;
			for(var k=0, len3 =this.drifters.length; k<len3; k++){
				//if (this.drifters[k].hasPoint(b.x, b.y)){
				drifter = this.drifters[k];
				if (Math.sqrt(Math.pow(drifter.x - b.x, 2) + Math.pow(drifter.y - b.y,2)) < DrifterCollisionRadius){

					this.addPoints(DrifterPoints);

					// Remove dead drifter
					this.drifters[k].die_sound.play();
					this.drifters.splice(k, 1);
					len3--;
					k--;

					bulletRemove = true;
				}
			}
			if(bulletRemove){
				this.bullets.splice(j, 1);
				len2--;
				j--;
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
		this.ship.update(paceFactor, 
						 this.vortex.radiusToAngularVelocity(this.ship.radius, true),
						 this.vortex.radius);

		// Update vortex
		var isCollapsed = this.vortex.update(paceFactor, this.vortexCollapse);
		if (isCollapsed){
			this.vortexCollapse = false;
		}

		//----------------
		// Drifers
		//----------------

		//Spawn
		if(!this.vortexCollapse && this.ship.visible){
			if((Math.random() < DrifterSpawnRate) || (this.drifters.length == 0)){
				drifter = new Drifter(Points.POINTY_SHIP, 2, this.center_x, this.center_y,
					DrifterMaxRadius, Math.random() * Math.PI * 2, Colors.RED,
					this.vortex.radiusToAngularVelocity);
				this.drifters.push(drifter);
			}
		}

		// Update & check player collisions
		var numObjectsConsumed = 0;
		for(var i=0, len=this.drifters.length; i<len; i++){
			numObjectsConsumed += this.drifters[i].update(paceFactor, this.vortex.radius);
			if(this.drifters[i].alive == false){
				// Remove dead drifter
				this.drifters.splice(i, 1);
				len--;
				i--;
			} else{
				if(this.ship.visible){
					d = this.drifters[i];
					if (Math.sqrt(Math.pow(d.x - this.ship.x, 2) + Math.pow(d.y - this.ship.y,2)) < DrifterCollisionRadius*2){
						this.ship.vortexDeath = true; // Not realy a vortex death, but works for now.
						this.player_die_sound.play();

						// Remove dead drifter
						this.drifters.splice(i, 1);
						len--;
						i--;
					}
				}
			}
		}
		if(numObjectsConsumed>0){
			if(!this.vortexCollapse && this.ship.visible){
				this.vortex.grow(numObjectsConsumed);
			}
		}



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

		ctx.vectorText(this.score, 3, 15, 15, null, Colors.YELLOW);

		for(var i=0; i<this.lives; i++){
			ctx.drawPolygon(this.lifepolygon, 25+25*i, 50);
		}
		
		/*
		// Stars
		ctx.fillStyle="#808080";
		for(var i=0, len=this.stars.length; i<len; i+=2){
			//console.log(this.stars[i]);
			ctx.fillRect(this.stars[i],this.stars[i+1],2,2);
		}
		*/

		for (var i=0, len=this.bullets.length; i < len; i++){
			this.bullets[i].draw(ctx);
		}

		if(this.gameOver){
			ctx.vectorText("Game Over", 6, null, 200, null, Colors.GREEN);
		} 

		// Drifters
		for(var i=0, len=this.drifters.length; i<len; i++){
			this.drifters[i].draw(ctx);
		}

		this.ship.draw(ctx);

		var showCollapse = (this.vortexCollapse || (this.ship.visible == false && this.drifters.length > 0));
		this.vortex.draw(ctx, showCollapse);
	}
})