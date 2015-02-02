var ShipGravity = 0.08; //0.02;
var ShipThrust = 0.40; //0.10;
var ShipRecoil = 1.0; 

var Ship = Polygon.extend({

	maxX: null,
	maxY: null,

	init: function(p, pf, s, x, y, radius, radialAngle, color, f_radiusToAngularVelocity){
		this._super(p, color);

		this.flames = new Polygon(pf, Colors.CYAN);
		this.flames.setScale(s);

		this.center_x = x;
		this.center_y = y;
		this.radius = radius;
		this.radialAngle = radialAngle;
		this.angle = 0;
		this.scale = s;
		this.ascentVelocity = 0;
		this.angularVelocity = 0;

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
			urls: ['sounds/Laser_Shoot_sustained.wav'],
			volume: 0.25,
		});

		this.vortex_consume_player_sound = new Howl({
			urls: ['sounds/VortexConsume.wav'],
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
		var b = new Bullet(b_x, b_y, this.radialAngle + b_advance_angle); // start bullet angle one animation frame forward
			
		//var theta = this.f_radiusToAngularVelocity(this.radius);
		//var ship_direction = this.angle + Math.PI/2;
		//var ship_velocity = Math.sin(theta)*this.radius;
		//b.vel.x += ship_velocity * Math.cos(ship_direction);
		//b.vel.y += ship_velocity * Math.sin(ship_direction);
		b.maxX = this.maxX;
		b.maxY = this.maxY;
		b.update(); // Move the bullet one frame to get it away from the ship

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
		this.ascentVelocity -= ShipGravity;
		this.radius += this.ascentVelocity;
		if (this.radius < vortexRadius){
			if(!this.vortexDeath){
				this.ascentVelocity = 0;
				this.radius =vortexRadius;
				this.vortexDeath = true;
				this.vortex_consume_player_sound.play();
			}
		}
		if (this.radius > 370){
			this.ascentVelocity = 0;
			this.radius =370;
		}
		this.radialAngle += angularVelocity;
		this.radial_to_cardinal();
	},

	draw: function(ctx){
		if(this.visible){
			ctx.drawPolygon(this, this.x, this.y);
			if (this.drawFlames){
				ctx.drawPolygon(this.flames, this.x, this.y);
				this.drawFlames = false;
			};
		}
	}
})