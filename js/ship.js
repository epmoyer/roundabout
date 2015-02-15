var ShipGravity = 0.08; //0.02;
var ShipThrust = 0.40; //0.10;
var ShipRecoil = 1.0;
var ShipMaxRadius = 370;
var ShipBulletVelocity = 5;

var Ship = FlynnPolygon.extend({

	maxX: null,
	maxY: null,

	init: function(p, pf, s, x, y, radius, radialAngle, color, f_radiusToAngularVelocity, vortex){
		this._super(p, color);

		this.flames = new FlynnPolygon(pf, FlynnColors.CYAN);
		this.flames.setScale(s);

		this.center_x = x;
		this.center_y = y;
		this.radius = radius;
		this.radialAngle = radialAngle;
		this.angle = 0;
		this.scale = s;
		this.ascentVelocity = 0;
		this.angularVelocity = 0;
		this.vortex = vortex;

		this.x = null;
		this.y = null;

		this.drawFlames = false;
		this.visible = true;

		this.setScale(s);
		this.radial_to_cardinal();
		this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

		this.vel = {
			x: 0,
			y: 0
		};

		this.vortexDeath = false;

		this.shoot_sound = new Howl({
			src: ['sounds/Laser_Shoot_sustained.wav'],
			volume: 0.25,
		});

		this.vortex_consume_player_sound = new Howl({
			src: ['sounds/VortexConsume.wav'],
			volume: 0.50,
		});
	},

	// Calculate caridnal position and angle from radial position and angle
	radial_to_cardinal: function(){
		this.setAngle(this.radialAngle);
		this.flames.setAngle(this.radialAngle);
		this.x = this.center_x + this.radius * Math.cos(this.radialAngle);
		this.y = this.center_y + this.radius * Math.sin(this.radialAngle);
	},

	collide: function(aster){
		if (!this.visible){
			return false;
		}
		for(i=0, len=this.points.length -2; i<len; i+=2){
			var x = this.points[i] + this.x;
			var y = this.points[i+1] + this.y;

			if (aster.hasPoint(x,y)){
				return true;
			}
		}
		return false;
	},

	hasPoint: function(x, y) {
		return this._super(this.x, this.y, x, y);
	},

	shoot: function() {
		this.shoot_sound.play();
		var b_advance_angle = this.angularVelocity; // start bullet angle one animation frame forward
		var b_x = this.center_x + this.radius * Math.cos(this.radialAngle + b_advance_angle) + this.points[0];
		var b_y = this.center_y + this.radius * Math.sin(this.radialAngle + b_advance_angle) + this.points[1];
		var b = new FlynnBullet(b_x, b_y, this.radialAngle + b_advance_angle, ShipBulletVelocity, this.color); // start bullet angle one animation frame forward
		b.maxX = this.maxX;
		b.maxY = this.maxY;
		b.update(1.0); // Move the bullet one frame to get it away from the ship

		//Recoil
		this.ascentVelocity -= ShipRecoil;
		return b;
	},

	addVel: function() {
		this.ascentVelocity += ShipThrust;
		this.drawFlames = true;
	},

	update: function(paceFactor, angularVelocity, vortexRadius) {
		//console.log(paceFactor);
		this.angularVelocity = angularVelocity;
		this.ascentVelocity -= ShipGravity * paceFactor;
		this.radius += this.ascentVelocity * paceFactor;

		// Do not descend below vortex shield (if active)
		if (this.vortex.shieldActive){
			if(this.radius < this.vortex.shieldRadius){
				this.radius = this.vortex.shieldRadius;
				this.ascentVelocity = 0;
			}
		}

		// Die if fall into vortex
		if (this.radius < vortexRadius){
			if(!this.vortexDeath){
				this.ascentVelocity = 0;
				this.radius =vortexRadius;
				this.vortexDeath = true;
				this.vortex_consume_player_sound.play();
			}
		}

		// Do not fly past max raius
		if (this.radius > ShipMaxRadius){
			this.ascentVelocity = 0;
			this.radius = ShipMaxRadius;
		}
		this.radialAngle += angularVelocity * paceFactor;
		this.radial_to_cardinal();

		// Update vortex shield angle to match ship
		this.vortex.shieldPolygon.setAngle(this.radialAngle);
	},

	draw: function(ctx){
		if(this.visible){
			ctx.drawPolygon(this, this.x, this.y);
			if (this.drawFlames){
				ctx.drawPolygon(this.flames, this.x, this.y);
				this.drawFlames = false;
			}
		}
	}
});