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

var SpawnOverlapRetries = 16;
var OverlapAngleSpacing = Math.PI/16;

var ReflectedBulletLife = 15;

var ShipBounceMinVelocity = 1.5;

var VortexShieldEndScore = 500;

var ShipNumExplosionParticles = 30;

var PopUpTextLife = 3 * 60;
var PopUpThrustPromptTime = 2 * 60;
var PopUpFirePromptTime = 5 * 60;
var PopUpCancelTime = 15; // Ticks to remove a pop-up when canceled

var BulletsMax = 4;

var ExtraLifeScore = 5000;

var GameState = FlynnState.extend({

	init: function(mcp) {
		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;

		this.vortex = new Vortex(this.center_x, this.center_y);

		this.ship = new Ship(Points.WIDE_SHIP, Points.FLAMES, 1.5, this.center_x, this.center_y,
			ShipStartRadius, ShipStartAngle, FlynnColors.YELLOW, this.vortex.radiusToAngularVelocity, this.vortex);
		this.ship.maxX = this.canvasWidth;
		this.ship.maxY = this.canvasHeight;

		this.gameOver = false;
		this.lives = 3;
		this.lifepolygon = new FlynnPolygon(Points.WIDE_SHIP, FlynnColors.YELLOW);
		this.lifepolygon.setScale(1.2);
		this.lifepolygon.setAngle(-Math.PI/2);

		this.score = 0;
		this.highscore = this.mcp.highscores[0][1];

		this.lvl = 0;

		this.generateLvl();

		this.engine_sound = new Howl({
			src: ['sounds/Engine.ogg','sounds/Engine.mp3'],
			volume: 0.25,
			loop: true,
		});
		this.player_die_sound = new Howl({
			src: ['sounds/Playerexplosion2.ogg','sounds/Playerexplosion2.mp3'],
			volume: 0.25,
		});
		this.extra_life_sound = new Howl({
			src: ['sounds/ExtraLife.ogg','sounds/ExtraLife.mp3'],
			volume: 1.00,
		});
		this.shot_reflect_sound = new Howl({
			src: ['sounds/Blocked.ogg','sounds/Blocked.mp3'],
			volume: 0.25,
		});
		this.drifter_die_sound = new Howl({
			src: ['sounds/Drifterexplosion.ogg','sounds/Drifterexplosion.mp3'],
			volume: 0.25,
		});
		this.blocker_die_sound = new Howl({
			src: ['sounds/Drifterexplosion.ogg','sounds/Drifterexplosion.mp3'],
			volume: 0.25,
		});
		this.engine_sound_playing = false;

		this.vortexCollapse = false;

		// Game Clock
		this.gameClock = 0;

		// Aliens
		this.drifters = [];
		this.blockers = [];

		// Vortex
		this.particles = new FlynnParticles(this.center_x, this.center_y, this.vortex.radiusToAngularVelocity);
		this.vortex.particles = this.particles;

		// Pop-up messages
		this.popUpText = "";
		this.popUpText2 = null;
		this.popUpLife = 0;
		this.popUpThrustPending = true;
		this.popUpFirePending = true;
		this.popUpThrustActive = false;
		this.popUpFireActive = false;
		this.thrustHasOccurred = false;
		this.popupShieldErodePending = true;
	},

	generateLvl: function() {
		var margin = 20;

		this.ship.radius = ShipStartRadius;
		this.ship.radialAngle = ShipStartAngle;

		this.bullets = [];
		this.drifters = [];
		this.blockers = [];
	},

	angleBound2Pi: function(angle){
		boundAngle = angle % (Math.PI * 2);
		if(boundAngle<0){
			boundAngle += (Math.PI * 2);
		}
		return (boundAngle);
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

		// Update highscore if exceeded
		if (this.score > this.highscore){
			this.highscore = this.score;
		}
	},

	showPopUp: function(popUpText, popUpText2){
		if(typeof(popUpText2)==='undefined'){
			popUpText2 = null;
		}

		this.popUpText = popUpText;
		this.popUpText2 = popUpText2;
		this.popUpLife = PopUpTextLife;
	},

	handleInputs: function(input) {

		if(DeveloperModeEnabled){
			// Metrics toggle
			if (input.isPressed("one")){
				this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
			}

			// Slow Mo Debug toggle
			if (input.isPressed("two")){
				this.mcp.slowMoDebug = !this.mcp.slowMoDebug;
			}

			// Points
			if (input.isPressed("three")){
				this.addPoints(100);
			}

			// Die
			if (input.isPressed("four")){
				this.ship.vortexDeath = true;
			}

			// Grow vortex
			if (input.isPressed("five")){
				this.vortex.grow(1);
			}

		}
		
		if(!this.ship.visible){
			if (input.isPressed("spacebar") || input.isPressed("touchFire") || input.isPressed("touchThrust")){
				if (this.gameOver){
					if(this.mcp.browserSupportsTouch){
						// On touch devices just update high score and go back to menu
						this.mcp.updateHighScores("NONAME", this.score);

						this.mcp.nextState = States.MENU;
					} else {
						this.mcp.nextState = States.END;
					}
					this.mcp.custom.score = this.score;
					return;
				}
			}
			return;
		}


		if (input.isDown("z") || input.isDown("touchThrust")){
			this.thrustHasOccurred = true;
			this.popUpThrustPending = false;
			this.ship.addVel();
			if(!this.engine_sound_playing){
				this.engine_sound.play();
				this.engine_sound_playing = true;
			}

			// Cancel PopUp
			if(this.popUpThrustActive){
				this.popUpLife = Math.min(PopUpCancelTime, this.popUpLife);
			}
		} else {
			if (this.engine_sound_playing){
				this.engine_sound.stop();
				this.engine_sound_playing = false;
			}
		}

		if (input.isPressed("spacebar") || input.isPressed("touchFire")){
			this.popUpFirePending = false;

			// Limit max shots on screen 
			if(this.bullets.length < BulletsMax){
				this.bullets.push(this.ship.shoot());
			}

			// Cancel PopUp
			if(this.popUpFireActive){
				this.popUpLife = Math.min(PopUpCancelTime, this.popUpLife);
			}
		}

	},

	update: function(paceFactor) {
		var i, len, b, numOusideEnemies, outsideEnemyAngles;

		this.gameClock += paceFactor;

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
				for(i=0, len=this.drifters.length; i<len; i++){
					this.drifters[i].deathDive = true;
				}
				for(i=0, len=this.blockers.length; i<len; i++){
					this.blockers[i].deathDive = true;
				}
			}
		}
		else{
			// Respawn after all enmies have cleared the playfield
			if(!this.gameOver){
				if((this.drifters.length === 0) && (this.blockers.length === 0)){
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
			b = this.bullets[j];
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
					this.drifter_die_sound.play();
					this.drifters.splice(k, 1);
					len3--;
					k--;

					bulletRemove = true;
				}
			}
			// Shoot blockers
			for(k=0, len3 =this.blockers.length; k<len3; k++){
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
		for (i=0, len=this.bullets.length; i < len; i++){
			b = this.bullets[i];
			b.update(paceFactor);

			if(b.shallRemove) {
				this.bullets.splice(i, 1);
				len--;
				i--;
			}
		}

		// Update ship
		this.ship.update(
			paceFactor,
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
			if((Math.random() < DrifterSpawnRate) || (this.drifters.length === 0)){
				var drifterRadius;
				var drifterAngle;
				if(this.drifters.length === 0){
					// Start first drifter at one of the midscreen edges, so that it is immediately visisble
					if (Math.random() > 0.5){
						// Left/right
						drifterRadius = this.center_x;
						if (Math.random() > 0.5){
							drifterAngle = 0;
						}
						else{
							drifterAngle = Math.PI;
						}
					} else {
						// Top/bottom
						drifterRadius = this.center_y;
						if (Math.random() > 0.5){
							drifterAngle = Math.PI/2;
						}
						else{
							drifterAngle = Math.PI*3/2;
						}
					}
				}
				else {
					drifterRadius = DrifterMaxRadius;
					drifterAngle =  Math.random() * Math.PI * 2;

					// Make sure new drifter is not on top of an existing enemy
					numOusideEnemies = 0;
					outsideEnemyAngles = [];
					for(i=0, len=this.drifters.length; i<len; i++){
						if(this.drifters[i].radius > drifterRadius - (DrifterCollisionRadius * 2)){
							outsideEnemyAngles.push(this.angleBound2Pi(this.drifters[i].radialAngle));
							++numOusideEnemies;
						}
					}
					for(i=0, len=this.blockers.length; i<len; i++){
						if(this.blockers[i].radius > drifterRadius - (BlockerCollisionRadius + DrifterCollisionRadius)){
							outsideEnemyAngles.push(this.angleBound2Pi(this.blockers[i].radialAngle));
							++numOusideEnemies;
						}
					}
					if(numOusideEnemies > 0){
						// Try SpawnOverlapRetries times, then give up
						for (i = 0; i<SpawnOverlapRetries; i++){
							overlapping = false;
							for(j=0; j<numOusideEnemies; j++){
								if(Math.abs(drifterAngle-outsideEnemyAngles[j]) < OverlapAngleSpacing){
									overlapping = true;
								}
							}
							if(!overlapping){
								break;
							}
							else {
								drifterAngle = this.angleBound2Pi(drifterAngle + OverlapAngleSpacing);
								//console.log("DEV: Advancing drifter spawn.");
							}
						}
					}
				}

				// Create drifter
				drifter = new Drifter(Points.POINTY_SHIP, 2, this.center_x, this.center_y,
					drifterRadius, drifterAngle, FlynnColors.RED,
					this.vortex.radiusToAngularVelocity);
				this.drifters.push(drifter);
			}
		}

		// Update & check player collisions
		var numObjectsConsumed = 0;
		for(i=0, len=this.drifters.length; i<len; i++){
			numObjectsConsumed += this.drifters[i].update(paceFactor, this.vortex.radius);
			if(this.drifters[i].alive === false){
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

		//----------------
		// Blockers
		//----------------

		//Spawn
		if(!this.vortexCollapse && this.ship.visible && this.score >= BlockerAppearScore){
			if((Math.random() < BlockerSpawnRate) || (this.blockers.length === 0)){

				var blockerRadius = DrifterMaxRadius;
				var blockerAngle = Math.random() * Math.PI * 2;

				// Make sure new blocker is not on top of an existing enemy
				numOusideEnemies = 0;
				outsideEnemyAngles = [];
				for(i=0, len=this.drifters.length; i<len; i++){
					if(this.drifters[i].radius > blockerRadius - (DrifterCollisionRadius + BlockerCollisionRadius)){
						outsideEnemyAngles.push(this.angleBound2Pi(this.drifters[i].radialAngle));
						++numOusideEnemies;
					}
				}
				for(i=0, len=this.blockers.length; i<len; i++){
					if(this.blockers[i].radius > blockerRadius - (BlockerCollisionRadius*2)){
						outsideEnemyAngles.push(this.angleBound2Pi(this.blockers[i].radialAngle));
						++numOusideEnemies;
					}
				}
				if(numOusideEnemies > 0){
					// Try SpawnOverlapRetries times, then give up
					for (i = 0; i<SpawnOverlapRetries; i++){
						overlapping = false;
						for(j=0; j<numOusideEnemies; j++){
							if(Math.abs(blockerAngle-outsideEnemyAngles[j]) < OverlapAngleSpacing){
								overlapping = true;
							}
						}
						if(!overlapping){
							break;
						}
						else {
							blockerAngle = this.angleBound2Pi(blockerAngle + OverlapAngleSpacing);
						}
					}
				}

				blocker = new Blocker(Points.SHIELD_TYPE_SHORT, Points.SHIELD_CORE_SHORT, 2, this.center_x, this.center_y,
					blockerRadius, blockerAngle, FlynnColors.RED,
					this.vortex.radiusToAngularVelocity);
				this.blockers.push(blocker);
			}
		}

		// Update & check player collisions
		for(i=0, len=this.blockers.length; i<len; i++){
			numObjectsConsumed += this.blockers[i].update(paceFactor, this.vortex.radius);
			if(this.blockers[i].alive === false){
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
							this.blocker_die_sound.play();
							this.particles.explosion(d.radius, d.radialAngle, BlockerNumExplosionParticles, blocker.color);
							this.particles.explosion(d.radius, d.radialAngle, BlockerCoreExplosionParticles, blocker.core.color);
							
							// Remove dead blocker
							this.blockers.splice(i, 1);
							len--;
							i--;

                            this.addPoints(BlockerPoints);

							// Bounce the ship
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

		//-------------------
		// PopUps
		//-------------------
		// Life
		var oldPopUpLife = this.popUpLife;
		this.popUpLife -= paceFactor;

		// Expiration
		if ((this.popUpLife <= 0) && (oldPopUpLife > 0)){
			// PopUp Expired
			this.popUpThrustActive = false;
			this.popUpFireActive = false;
		}

		// Generation
		if(this.popUpThrustPending){
			if (this.gameClock >= PopUpThrustPromptTime)
			{
				this.popUpThrustPending = false;
				this.popUpThrustActive = true;
				this.showPopUp(this.mcp.custom.thrustPrompt);
				this.popUpLife = PopUpTextLife;
			}
		}
		if (this.popUpFirePending && this.thrustHasOccurred){
			if (this.gameClock >= PopUpFirePromptTime)
			{
				this.popUpFirePending = false;
				this.popUpFireActive = true;
				this.showPopUp(this.mcp.custom.shootPrompt);
				this.popUpLife = PopUpTextLife;
			}
		}
		if (this.vortex.shieldErode && this.popupShieldErodePending){
			this.popupShieldErodePending = false;
			this.showPopUp("SHIELD COLLAPSE", "AVOID VORTEX");
			this.popUpLife = PopUpTextLife;
		}

		// Vortex grow
		if(numObjectsConsumed>0){
			if(!this.vortexCollapse && this.ship.visible){
				this.vortex.grow(numObjectsConsumed);
			}
		}

		// Vortex shield
		if(this.score >= VortexShieldEndScore){
			this.vortex.shieldErode = true;
		}

		// Particles
		this.particles.update(paceFactor);
	},

	render: function(ctx){
		ctx.clearAll();

		// DEBUG: Show number of stars
		//ctx.vectorText(this.vortex.stars.length, 3,300,15,null, FlynnColors.GREEN);

		// Scores
		ctx.vectorText(this.score, 3, 15, 15, null, FlynnColors.YELLOW);
		ctx.vectorText(this.highscore, 3, this.canvasWidth - 6	, 15, 0 , FlynnColors.YELLOW);

		// Extra Lives
		for(var i=0; i<this.lives; i++){
			ctx.drawPolygon(this.lifepolygon, 25+25*i, 50);
		}

		// PopUp Text
		if(this.popUpLife > 0){
			ctx.vectorTextArc(this.popUpText,
				3, this.vortex.center_x, this.vortex.center_y,
				Math.PI*3/2, 150, FlynnColors.YELLOW, true, false);
			if(this.popUpText2){
				ctx.vectorTextArc(this.popUpText2,
					3, this.vortex.center_x, this.vortex.center_y,
					Math.PI/2, 150, FlynnColors.YELLOW, true, true);
			}
		}

		// Bullets
		for (i=0, len=this.bullets.length; i < len; i++){
			this.bullets[i].draw(ctx);
		}

		// Game OVer
		if(this.gameOver){
			ctx.vectorText("Game Over", 6, null, 200, null, FlynnColors.GREEN);
		}

		// Drifters
		for(i=0, len=this.drifters.length; i<len; i++){
			this.drifters[i].draw(ctx);
		}

		// Blockers
		for(i=0, len=this.blockers.length; i<len; i++){
			this.blockers[i].draw(ctx);
		}

		// Player
		this.ship.draw(ctx);

		// Vortex
		var showCollapse = (this.vortexCollapse || (this.ship.visible === false && this.drifters.length > 0));
		this.vortex.draw(ctx, showCollapse);

		// Particles
		this.particles.draw(ctx);
	}
});