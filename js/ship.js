var Gravity = 0.01;

var Ship = Polygon.extend({

	maxX: null,
	maxY: null,

	init: function(p, pf, s, x, y, radius, radialAngle){
		this._super(p);

		//this.flames = new Polygon(pf);
		//this.flames.scale(s);

		this.center_x = x;
		this.center_y = y;
		this.radius = radius;
		this.radialAngle = radialAngle;
		this.angle = 0;
		this.scale = s;
		this.ascentVelocity = 0;

		this.x = null;
		this.y = null;

		this.drawFlames = false;
		this.visible = true;

		this.setScale(s);
		this.radial_to_cardinal();

		this.vel = {
			x: 0,
			y: 0
		}
	},

	// Calculate caridnal position and angle from radial position and angle
	radial_to_cardinal: function(){
		this.setAngle(this.radialAngle);
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
		var b = new Bullet(this.points[0] + this.x, this.points[1] + this.y, this.angle);
		b.maxX = this.maxX;
		b.maxY = this.maxY;
		b.update(); // Move the bullet one frame to get it away from the ship
		return b;
	},

	addVel: function() {
		this.ascentVelocity += 0.05;
		this.drawFlames = true;
	},

	update: function(paceFactor, angularVelocity) {
		//console.log(paceFactor);
		this.ascentVelocity -= Gravity;
		this.radius += this.ascentVelocity;
		if (this.radius < 30){
			this.ascentVelocity = 0;
			this.radius =30;
		}
		if (this.radius > 220){
			this.ascentVelocity = 0;
			this.radius =220;
		}
		this.radialAngle += angularVelocity;
		this.radial_to_cardinal();
	},

	draw: function(ctx){
		if(this.visible){
			ctx.drawPolygon(this, this.x, this.y);
			if (this.drawFlames){
				//ctx.drawPolygon(this.flames, this.x, this.y);
				this.drawFlames = false;
			};
		}
	}
})