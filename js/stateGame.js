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

var ReflectedProjectileLife = 15;

var ShipBounceMinVelocity = 1.5;

var VortexShieldEndScore = 500;

var ShipNumExplosionParticles = 50;
var ShipRespawnDelayTicks = 30;
var ShipRespawnDelayGameStartTicks = 60 * 1.25; // Respawn delay at inital start
var ShipRespawnAnimationTicks = 60 * 1.8;
var ShipRespawnScaleMax = 35;
var ShipRespawnScaleMin = 0.1;
var ShipRespawnAngleMax = Math.PI * 2 * 0.8;

var PopUpTextLife = 3 * 60;
var PopUpThrustPromptTime = 4 * 60; //2 * 60;
var PopUpFirePromptTime = 7 * 60; //5 * 60;
var PopUpCancelTime = 15; // Ticks to remove a pop-up when canceled

var ExtraLifeScore = 5000;

var ProjectilesMax = 4;
var ProjectileSize = 3;

var StateGame = FlynnState.extend({

	init: function(mcp) {
		this._super(mcp);
		
		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;
		this.center_x = this.canvasWidth/2;
		this.center_y = this.canvasHeight/2;
		this.viewport_v = new Victor(0,0);

		this.vortex = new Vortex(this.center_x, this.center_y);

		this.ship = new Ship(Points.WIDE_SHIP, Points.FLAMES, 1.5, this.center_x, this.center_y,
			ShipStartRadius, ShipStartAngle, FlynnColors.YELLOW, this.vortex.radiusToAngularVelocity, this.vortex);
		this.ship.maxX = this.canvasWidth;
		this.ship.maxY = this.canvasHeight;
		this.ship.visible = false; // Start invisible, to force respawn animation

		this.respawnPolygon = new FlynnPolygon(Points.RESPAWN, FlynnColors.YELLOW);
		this.respawnPolygon.setScale(1);
		this.shipRespawnX = this.center_x + ShipStartRadius * Math.cos(ShipStartAngle);
		this.shipRespawnY = this.center_y + ShipStartRadius * Math.sin(ShipStartAngle);

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
		this.ship_respawn_sound = new Howl({
			src: ['sounds/ShipRespawn.ogg','sounds/ShipRespawn.mp3'],
			volume: 0.25,
		});
		this.engine_sound_playing = false;

		this.vortexCollapse = false;

		// Game Clock
		this.gameClock = 0;

		// Timers
		this.mcp.timers.add('shipRespawnDelay', ShipRespawnDelayGameStartTicks, null);  // Start game with a delay (for start sound to finish)
		this.mcp.timers.add('shipRespawnAnimation', 0, null);
		this.shipRespawnDelayExpired = false;
		this.shipRespawnAnimationStarted = false;

		// Aliens
		this.drifters = [];
		this.blockers = [];

		// Vortex
		this.particles = new Particles(this.center_x, this.center_y, this.vortex.radiusToAngularVelocity);
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

		this.projectiles = new FlynnProjectiles( new Victor(0,0), new Victor(this.canvasWidth, this.canvasHeight));
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
			this.score += points;
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

	doShipDie: function(){
		// Visibility
		this.ship.visible = false;

		// Lives
		this.lives--;
		if(this.lives <= 0){
			this.gameOver = true;
		}

		// Sounds
		this.engine_sound.stop();

		// Explosion
		if(!this.ship.deathByVortex){
			this.player_die_sound.play();
			this.particles.explosion(
				this.ship.radius, this.ship.radialAngle, ShipNumExplosionParticles,
				this.ship.color, ShipExplosionMaxVelocity);
		}

		// Timers
		this.mcp.timers.set('shipRespawnDelay', ShipRespawnDelayTicks, null);
		this.mcp.timers.set('shipRespawnAnimation', 0, null); // Set to zero to deactivate it
		this.shipRespawnDelayExpired = false;
		this.shipRespawnAnimationStarted = false;

		// Vortex
		this.vortexCollapse = true;
		// Make all enemies death dive to clear the play field
		for(i=0, len=this.drifters.length; i<len; i++){
			this.drifters[i].deathDive = true;
		}
		for(i=0, len=this.blockers.length; i<len; i++){
			this.blockers[i].deathDive = true;
		}
	},

	handleInputs: function(input, paceFactor) {

		if(this.mcp.developerModeEnabled){
			// Metrics toggle
			if (input.virtualButtonIsPressed("dev_metrics")){
				this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
			}

			// Toggle DEV pacing mode slow mo
			if (input.virtualButtonIsPressed("dev_slow_mo")){
				this.mcp.toggleDevPacingSlowMo();
			}

			// Toggle DEV pacing mode fps 20
			if (input.virtualButtonIsPressed("dev_fps_20")){
				this.mcp.toggleDevPacingFps20();
			}

			// Points
			if (input.virtualButtonIsPressed("dev_add_points")){
				this.addPoints(100);
			}

			// Die
			if (input.virtualButtonIsPressed("dev_die")){
				this.doShipDie();
			}

			// Grow vortex
			if (input.virtualButtonIsPressed("vortex_grow")){
				this.vortex.grow(1);
			}
		}
		
		if(!this.ship.visible){
			if (input.virtualButtonIsPressed("UI_enter")){
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


		if (input.virtualButtonIsDown("thrust")){
			this.thrustHasOccurred = true;
			this.popUpThrustPending = false;
			this.ship.addVel(paceFactor);
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

		if (input.virtualButtonIsPressed("fire")){
			this.popUpFirePending = false;

			// Limit max shots on screen 
			if(this.projectiles.projectiles.length < ProjectilesMax){
				var projectile = this.ship.shoot();
				this.projectiles.add(
					projectile.world_position_v,
					projectile.velocity_v,
					projectile.lifetime,
					ProjectileSize,
					projectile.color
					);
				this.projectiles.advanceFrame(); // Move the projectile one frame to get it away from the ship
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
			// Update ship
			var isAlive = this.ship.update(
				paceFactor,
				this.vortex.radiusToAngularVelocity(this.ship.radius, true),
				this.vortex.radius);
			if(!isAlive){
				this.doShipDie();
			}
		}
		else{
			// Ship not visible
			if(!this.gameOver){
				if(this.mcp.timers.hasExpired('shipRespawnDelay')){
					this.shipRespawnDelayExpired = true;
				}

				if(	(this.drifters.length === 0) &&
					(this.blockers.length === 0) &&
					this.shipRespawnDelayExpired &&
					!this.shipRespawnAnimationStarted){

					this.mcp.timers.set('shipRespawnAnimation', ShipRespawnAnimationTicks);
					this.shipRespawnAnimationStarted = true;
					this.ship_respawn_sound.play();
				}

				if(this.mcp.timers.isRunning('shipRespawnAnimation')){
					this.vortex.shieldAngleTarget = flynnUtilAngleBound2Pi(ShipStartAngle);
				}

				// If respawn animation has finished...
				if(this.mcp.timers.hasExpired('shipRespawnAnimation')){
					// Respawn the ship
					this.ship.radius = ShipStartRadius;
					this.ship.radialAngle = ShipStartAngle;
					this.ship.ascentVelocity = 0;
					this.ship.visible = true;
					this.ship.deathByVortex = false;
					this.ship.update(
						paceFactor,
						this.vortex.radiusToAngularVelocity(this.ship.radius, true),
						this.vortex.radius);
				}
			}
		}

		// Check projectile collisions
		for(var j=0, len2 = this.projectiles.projectiles.length; j<len2; j++){
			b = this.projectiles.projectiles[j];
			var bulletRemove = false;

			// Remove shots that reflect back into vortex
			if (Math.sqrt(Math.pow(b.world_position_v.x - this.center_x, 2) + Math.pow(b.world_position_v.y - this.center_y,2)) <= this.vortex.radius){
				bulletRemove = true;
			}

			// Shoot drifters
			for(var k=0, len3 =this.drifters.length; k<len3; k++){
				drifter = this.drifters[k];
				if (Math.sqrt(Math.pow(drifter.x - b.world_position_v.x, 2) + Math.pow(drifter.y - b.world_position_v.y,2)) < DrifterCollisionRadius){

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
				if (Math.sqrt(Math.pow(blocker.x - b.world_position_v.x, 2) + Math.pow(blocker.y - b.world_position_v.y,2)) < BlockerCollisionRadius){
					// Reverse bullet direction
					b.velocity_v.x =- b.velocity_v.x;
					b.velocity_v.y =- b.velocity_v.y;
					// Move the bullet after reflect, so that it cannot bounce around inside the blocker
					b.world_position_v.x += b.velocity_v.x;
					b.world_position_v.y += b.velocity_v.y;
					b.lifetime = ReflectedProjectileLife;
					this.shot_reflect_sound.play();
				}
			}
			if(bulletRemove){
				this.projectiles.projectiles.splice(j, 1);
				len2--;
				j--;
			}
		}


		// Update projectiles
		this.projectiles.update(paceFactor);

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
							outsideEnemyAngles.push(flynnUtilAngleBound2Pi(this.drifters[i].radialAngle));
							++numOusideEnemies;
						}
					}
					for(i=0, len=this.blockers.length; i<len; i++){
						if(this.blockers[i].radius > drifterRadius - (BlockerCollisionRadius + DrifterCollisionRadius)){
							outsideEnemyAngles.push(flynnUtilAngleBound2Pi(this.blockers[i].radialAngle));
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
								drifterAngle = flynnUtilAngleBound2Pi(drifterAngle + OverlapAngleSpacing);
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
						this.doShipDie();
						this.particles.explosion(d.radius, d.radialAngle, DrifterNumExplosionParticles, drifter.color);
						
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
						outsideEnemyAngles.push(flynnUtilAngleBound2Pi(this.drifters[i].radialAngle));
						++numOusideEnemies;
					}
				}
				for(i=0, len=this.blockers.length; i<len; i++){
					if(this.blockers[i].radius > blockerRadius - (BlockerCollisionRadius*2)){
						outsideEnemyAngles.push(flynnUtilAngleBound2Pi(this.blockers[i].radialAngle));
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
							blockerAngle = flynnUtilAngleBound2Pi(blockerAngle + OverlapAngleSpacing);
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
							this.doShipDie();
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

		// projectiles
		this.projectiles.draw(ctx, this.viewport_v);

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

		// Ship respawn animation
		if(this.mcp.timers.isRunning('shipRespawnAnimation')){
			var animationPercentage = this.mcp.timers.get('shipRespawnAnimation') / ShipRespawnAnimationTicks;
			var sizePercentageStep = 0.005;
			var rotationPercentageStep = 0.1;
			// for(i=0; i<9; i++){
			// 	var sizePercentage = animationPercentage + i*sizePercentageStep;
			// 	var rotationPercentage = animationPercentage + i*rotationPercentageStep;
			// 	//if (percentage < 0){
			// 	//	percentage = 0.1;
			// 	//}
			// 	this.respawnPolygon.setScale((ShipRespawnScaleMin + (ShipRespawnScaleMax - ShipRespawnScaleMin)*sizePercentage));
			// 	this.respawnPolygon.setAngle(ShipRespawnAngleMax * rotationPercentage);
			// 	ctx.drawPolygon(this.respawnPolygon, this.shipRespawnX, this.shipRespawnY);
			// }
			var startRadius = 200 * animationPercentage;
			var numParticles = 100 * (1-animationPercentage);
			var startAngle = Math.PI * 1 * animationPercentage;
			var angleStep = Math.PI * 8 / 100;
			var radiusStep = 2 * animationPercentage;
			ctx.fillStyle=FlynnColors.YELLOW;
			for(i=0; i<numParticles; i++){
				var angle = startAngle + i * angleStep;
				var radius = startRadius + radiusStep * i;
				var x = this.shipRespawnX + Math.cos(angle) * radius;
				var y = this.shipRespawnY + Math.sin(angle) * radius;
				ctx.fillRect(x,y,2,2);
			}
		}

		// Game OVer
		if(this.gameOver){
			ctx.vectorText("GAME OVER", 6, null, 200, null, FlynnColors.GREEN);
			ctx.vectorText("PRESS <ENTER>", 2, null, 250, null, FlynnColors.GREEN);
		}
	}
});