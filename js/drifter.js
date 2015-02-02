var DrifterFallSpeed = 0.3;

var Drifter = Polygon.extend({

	init: function(p, s, x, y, radius, radialAngle, color, f_radiusToAngularVelocity){
		this._super(p, color);

		this.center_x = x;
		this.center_y = y;
		this.radius = radius;
		this.radialAngle = radialAngle;
		this.angle = 0;
		this.scale = s;

		this.x = null;
		this.y = null;

		this.setScale(s);
		this.radial_to_cardinal();
		this.alive = true;
		this.deathDive = false;
		this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

		this.die_sound = new Howl({
			urls: ['sounds/Drifterexplosion.wav'],
			volume: 0.25,
		});

	},

	// Calculate caridnal position and angle from radial position and angle
	radial_to_cardinal: function(){
		this.setAngle(this.radialAngle - Math.PI/2);
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

	update: function(paceFactor, vortexRadius) {
		var numVortexed = 0;
		// Add rotational angle to stars based on radius
		this.radialAngle += this.f_radiusToAngularVelocity(this.radius) * paceFactor;
		if(this.deathDive){
			this.radius -= 12 * DrifterFallSpeed * paceFactor;
		} 
		else {
			this.radius -= DrifterFallSpeed * paceFactor;
		}
		this.radial_to_cardinal();
		if (this.radius < vortexRadius){
			// Drifter fell into the vortex, so regenerate it at the outside
			this.alive = false;
			++numVortexed;
		}
		return numVortexed;
	},

	draw: function(ctx){
		ctx.drawPolygon(this, this.x, this.y);
		//Colision radius visualization
		//ctx.beginPath();
		//ctx.arc(this.x,this.y,13,0,2*Math.PI);
		//ctx.stroke();
	}
})