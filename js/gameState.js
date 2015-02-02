var ShipStartRadius = 250;
var ShipStartAngle = -Math.PI / 2;

var DrifterMaxRadius = 1024/2+30;
var DrifterSpawnRate = 0.005;
var DrifterPoints = 100;
var DrifterCollisionRadius = 13;
var DrifterNumExplosionParticles = 20;

var BlockerAppearScore = 800;
var BlockerSpawnRate = 0.001;
var BlockerPoints = 250;
var BlockerCollisionRadius = 13;
var BlockerNumExplosionParticles = 30;
var BlockerCoreExplosionParticles = 10;

var ReflectedBulletLife = 15;

var ShipBounceDampening = 0.2;
var ShipBounceMinVelocity = 1.5;

var ShipNumExplosionParticles = 30;

var BulletsMax = 4;

var ExtraLifeScore = 5000;

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
		this.shot_reflect_sound = new Howl({
			urls: ['sounds/Blocked.wav'],
			volume: 0.25,
		});
		this.engine_sound_playing = false;

		this.vortexCollapse = false;

		// Aliens
		this.drifters = [];
		this.blockers = [];

		this.particles = new Particles(this.center_x, this.center_y, this.vortex.radiusToAngularVelocity);
	},

	generateLvl: function() {
		var num_asteroids = this.lvl+3; //Math.round(Math.pow(((this.lvl + 5)/10), 2) + 3);

		var margin = 20;

		this.ship.radius = ShipStartRadius;
		this.ship.radialAngle = ShipStartAngle;

		this.bullets = [];
		this.drifters = [];
		this.blockers = [];
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

		if(DeveloperModeEnabled){
			// Metrics toggle
			if (input.isPressed("one")){
				this.game.canvas.showMetrics = !this.game.canvas.showMetrics;
			}

			// Slow Mo Debug toggle
			if (input.isPressed("two")){
				/*
				if(this.game.slowMoDebug){
					this.game.slowMoDebug = false;
				}
				else {
					this.game.slowMoDebug = true;
				}
				*/
				this.game.slowMoDebug = !this.game.slowMoDebug;
			}
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
				for(var i=0, len=this.blockers.length; i<len; i++){
					this.blockers[i].deathDive = true;
				}
			}
		}
		else{
			// Respawn after all enmies have cleared the playfield
			if(!this.gameOver){
				if((this.drifters.length == 0) && (this.blockers.length == 0)){
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

			// Remove shots that reflect back into vortex
			if (Math.sqrt(Math.pow(b.x - this.center_x, 2) + Math.pow(b.y - this.center_y,2)) <= this.vortex.radius){
				bulletRemove = true;
			}

			// Shoot drifters
			for(var k=0, len3 =this.drifters.length; k<len3; k++){
				drifter = this.drifters[k];
				if (Math.sqrt(Math.pow(drifter.x - b.x, 2) + Math.pow(drifter.y - b.y,2)) < DrifterCollisionRadius){

					this.addPoints(DrifterPoints);

					// Explode
					this.particles.explosion(drifter.radius, drifter.radialAngle, DrifterNumExplosionParticles, drifter.color);

					// Remove dead drifter
					this.drifters[k].die_sound.play();
					this.drifters.splice(k, 1);
					len3--;
					k--;

					bulletRemove = true;
				}
			}
			// Shoot blockers
			for(var k=0, len3 =this.blockers.length; k<len3; k++){
				blocker = this.blockers[k];
				if (Math.sqrt(Math.pow(blocker.x - b.x, 2) + Math.pow(blocker.y - b.y,2)) < BlockerCollisionRadius){
					// Reverse bullet direction
					b.vel.x =- b.vel.x;
					b.vel.y =- b.vel.y;
					// Move the bullet after reflect, so that it cannot bounce around inside the blocker
					b.x += b.vel.x;
					b.y += b.vel.y;
					b.life = ReflectedBulletLife;
					this.shot_reflect_sound.play();
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
			b.update(paceFactor);

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

						this.particles.explosion(d.radius, d.radialAngle, DrifterNumExplosionParticles, drifter.color);
						this.particles.explosion(this.ship.radius, this.ship.radialAngle, ShipNumExplosionParticles, this.ship.color);

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

		//----------------
		// Blockers
		//----------------

		//Spawn
		if(!this.vortexCollapse && this.ship.visible && this.score >= BlockerAppearScore){
			if((Math.random() < BlockerSpawnRate) || (this.blockers.length == 0)){
				blocker = new Blocker(Points.SHIELD_TYPE_SHORT, Points.SHIELD_CORE_SHORT, 2, this.center_x, this.center_y,
					DrifterMaxRadius, Math.random() * Math.PI * 2, Colors.RED,
					this.vortex.radiusToAngularVelocity);
				this.blockers.push(blocker);
			}
		}

		// Update & check player collisions
		var numObjectsConsumed = 0;
		for(var i=0, len=this.blockers.length; i<len; i++){
			numObjectsConsumed += this.blockers[i].update(paceFactor, this.vortex.radius);
			if(this.blockers[i].alive == false){
				// Remove dead blocker
				this.blockers.splice(i, 1);
				len--;
				i--;
			} else{
				if(this.ship.visible){
					d = this.blockers[i];
					if (Math.sqrt(Math.pow(d.x - this.ship.x, 2) + Math.pow(d.y - this.ship.y,2)) < BlockerCollisionRadius*2){
						if(this.ship.radius > d.radius){
							// Ship destroys blocker
							d.die_sound.play();
							this.particles.explosion(d.radius, d.radialAngle, BlockerNumExplosionParticles, blocker.color);
							this.particles.explosion(d.radius, d.radialAngle, BlockerCoreExplosionParticles, blocker.core.color);
							
							// Remove dead blocker
							this.blockers.splice(i, 1);
							len--;
							i--;

							// Bounce the ship 
							//this.ship.ascentVelocity = -this.ship.ascentVelocity * ShipBounceDampening;
							this.ship.ascentVelocity = ShipBounceMinVelocity;
						}
						else {
							// Blocker destroys ship
							this.ship.vortexDeath = true; // Not realy a vortex death, but works for now.
							this.player_die_sound.play();
							this.particles.explosion(this.ship.radius, this.ship.radialAngle, ShipNumExplosionParticles, this.ship.color);
						}

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
		this.particles.update(paceFactor);
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

		// Blockers
		for(var i=0, len=this.blockers.length; i<len; i++){
			this.blockers[i].draw(ctx);
		}

		this.ship.draw(ctx);

		var showCollapse = (this.vortexCollapse || (this.ship.visible == false && this.drifters.length > 0));
		this.vortex.draw(ctx, showCollapse);

		this.particles.draw(ctx);
	}
})