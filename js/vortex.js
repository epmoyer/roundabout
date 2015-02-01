var VortexLines = 15;
var VortexThickness = 15;
var VortexStartRadius = 50;
var VortexRadialSpeed = -0.06;
var VortexTwist = 0.20;

var StarMaxRadius = 320;
var StarfallSpeed = 0.3;

var Vortex = Class.extend({

	init: function(x, y){
		this.radius = 20;
		this.angle = 0;
		this.center_x = x;
		this.center_y = y;

		this.stars = [];
		for (var i=0; i<100; i++){
			this.stars.push(Math.random() * StarMaxRadius);
			this.stars.push(Math.random() * Math.PI * 2);
		}
	},

	radiusToAngularVelocity: function(radius) {
		var distance = radius - 20;
		if (distance < 1){
			distance = 1;
		}
		return (-0.03 * ((StarMaxRadius - distance)/StarMaxRadius));
	},

	update: function() {
		this.angle += VortexRadialSpeed;

		// Add rotational angle to stars based on radius
		for(var i=0, len=this.stars.length; i<len; i+=2){
			this.stars[i+1] += this.radiusToAngularVelocity(this.stars[i]);
			this.stars[i] -= StarfallSpeed;
			if (this.stars[i] < (this.radius + VortexThickness/2)){
				// Star fell into the vortex, so regenerate it at the outside
				this.stars[i] = StarMaxRadius;
				this.stars[i+1] = Math.random() * Math.PI * 2;
			}
		}
	},

	draw: function(ctx) {
		// Vortex
		ctx.beginPath();
		for(theta = 0, angle_delta = (Math.PI * 2)/VortexLines; theta < (Math.PI * 2); theta += angle_delta){
			var sx = this.center_x + Math.cos(theta+this.angle - VortexTwist) * (this.radius - VortexThickness/2);
			var sy = this.center_y + Math.sin(theta+this.angle - VortexTwist) * (this.radius - VortexThickness/2);
			var ex = this.center_x + Math.cos(theta+this.angle + VortexTwist) * (this.radius + VortexThickness/2);
			var ey = this.center_y + Math.sin(theta+this.angle + VortexTwist) * (this.radius + VortexThickness/2);
			ctx.moveTo(sx,sy);
			ctx.lineTo(ex,ey);
		}
		ctx.stroke();

		// Stars
		ctx.fillStyle="#808080";
		for(var i=0, len=this.stars.length; i<len; i+=2){
			var radius = this.stars[i];
			var angle = this.stars[i+1];
			x = this.center_x + Math.cos(angle) * radius;
			y = this.center_y + Math.sin(angle) * radius;
			ctx.fillRect(x,y,2,2);
		}
	}
});