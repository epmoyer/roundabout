var VortexLines = 15;
var VortexThickness = 15;
var VortexStartRadius = 20;
var VortexMaxRadius = 350;
var VortexRadialSpeed = -0.06;
var VortexTwist = 0.20;
var VortexGrowRadius = 10;
var VortexGrowRate = 0.23;
var VortexCollapseRate = 1.0;
var VortexBoostRange = 70;
var VotexBoostVelocity = 0.06;

var VortexShieldPoints = 18;
var VortexShieldMargin = 15;
var VortexShieldDrawMargin = 3;
var VortexShieldErodeTime = 30;

var StarMaxRadius = 1024/2;
var StarfallSpeed = 0.3;
var StarSpawnRate = 0.07;
var StarNumMax = 100;


var Vortex = Class.extend({

	init: function(x, y){
		this.target_radius = VortexStartRadius;
		this.angle = 0;
		this.center_x = x;
		this.center_y = y;

		this.stars = [];
		for (var i=0; i<StarNumMax; i++){
			this.stars.push(Math.random() * StarMaxRadius);
			this.stars.push(Math.random() * Math.PI * 2);
		}

		this.vortex_consume_sound = new Howl({
			src: ['sounds/VortexConsume.wav'],
			volume: 1.0,
		});

		this.shield_erode_sound = new Howl({
			src: ['sounds/ShieldBreak.wav'],
			volume: 1.0,
		});

		// Build shield 
		var shieldPoints = [];
		for (var theta=0; theta<Math.PI+0.01; theta+=Math.PI*2/VortexShieldPoints){
			shieldPoints.push(Math.cos(theta-Math.PI/2));
			shieldPoints.push(Math.sin(theta-Math.PI/2));
		}
		this.shieldPolygon = new Polygon(shieldPoints, Colors.CYAN);
		this.shieldAngle = 0;
		this.shieldActive = true;
		this.shieldPolygon.setAngle(this.shieldAngle);
		this.shieldErodeTimer = VortexShieldErodeTime;
		this.shieldErode = false;

		this.setRadius(VortexStartRadius);
		this.particles = null;
	},

	radiusToAngularVelocity: function(radius, boost) {
		if(typeof(boost)==='undefined'){
			boost = false;
		}
		var boostVelocity = 0;
		var distance = radius - 20;
		if (distance < 1){
			distance = 1;
		}
		if (boost){
			var distanceFromVortex = radius - this.radius;
			if(distanceFromVortex < 0){
				distanceFromVortex = 0;
			}
			if(distanceFromVortex<VortexBoostRange){
				boostVelocity = VotexBoostVelocity * ((VortexBoostRange - distanceFromVortex)/VortexBoostRange);
			}
		}
		return -((0.03 * ((StarMaxRadius - distance)/StarMaxRadius)) + boostVelocity);
	},

	setRadius: function(radius){
		this.radius = radius;
		this.shieldRadius = radius + VortexShieldMargin;
		this.shieldPolygon.setScale(this.shieldRadius - VortexShieldDrawMargin);
	},

	grow: function(objectsConsumed) {
		this.target_radius += VortexGrowRadius * objectsConsumed;
		if (this.target_radius >= VortexMaxRadius){
			this.target_radius = VortexMaxRadius;
		}
		this.vortex_consume_sound.play();
	},

	caresianToAngle: function (x, y) {
		return Math.atan2(y-this.center_y, x-this.center_x);
	},

	cartesianToRadius: function (x, y) {
		return Math.sqrt(Math.pow(y-this.center_y,2) + Math.pow(x-this.center_x,2));
	},

	update: function(paceFactor, doCollapse) {
		isCollapsed = false;

		this.angle += VortexRadialSpeed * paceFactor;

		if (doCollapse){
			this.target_radius = VortexStartRadius;
			this.setRadius(this.radius - VortexCollapseRate * paceFactor);
			if (this.radius <= VortexStartRadius){
				this.setRadius(VortexStartRadius);
				isCollapsed = true;
			}
		}
		else{
			if(this.radius < this.target_radius){
				this.setRadius(this.radius + VortexGrowRate * paceFactor);
			}
		}

		//-----------
		// Stars
		//-----------
		// Add rotational angle to stars based on radius
		for(var i=0, len=this.stars.length; i<len; i+=2){
			this.stars[i+1] += this.radiusToAngularVelocity(this.stars[i], true) * paceFactor;
			this.stars[i] -= StarfallSpeed * paceFactor;
			if (this.stars[i] < (this.radius + VortexThickness/2)){
				// Star fell into the vortex, so remove it
				this.stars.splice(i,2);
				i-=2;
				len-=2;
			}
		}
		// Spawn
		if(this.stars.length < StarNumMax*2){
			if(Math.random() * paceFactor < StarSpawnRate){
				this.stars.push(Math.random() * StarMaxRadius);
				this.stars.push(Math.random() * Math.PI * 2);
			}
		}

		// Update shield
		if(this.shieldActive){
			// this.shieldAngle += VortexShieldRotationSpeed * paceFactor;
			// this.shieldAngle += VortexShieldRotationSpeed * paceFactor;
			// this.shieldPolygon.setAngle(this.shieldAngle);
		}
		if(this.shieldErode && this.shieldActive){
			this.shieldErodeTimer -= paceFactor;
			if(this.shieldErodeTimer <= 0){
				len = this.shieldPolygon.pointsMaster.length;
				if(len > 4){
					// Remove the end segments
					// console.log(this.shieldPolygon.pointsMaster);
					if(this.particles){
						x = this.shieldPolygon.points[2];
						y = this.shieldPolygon.points[3];
						this.particles.explosion(
							this.shieldRadius,
							Math.atan2(y,x),
							10,
							Colors.CYAN);
						x = this.shieldPolygon.points[len-4];
						y = this.shieldPolygon.points[len-3];
						this.particles.explosion(
							this.shieldRadius,
							Math.atan2(y,x),
							10,
							Colors.CYAN);
						this.shield_erode_sound.play();
					}
					this.shieldPolygon.pointsMaster.splice(len-2,2);
					this.shieldPolygon.points.splice(len-2,2);
					this.shieldPolygon.pointsMaster.splice(0,2);
					this.shieldPolygon.points.splice(0,2);
					this.shieldErodeTimer = VortexShieldErodeTime;
				}else{
					// Shield eroded.
					this.shieldActive = false;
				}
			}
		}

		return isCollapsed;
	},

	draw: function(ctx, doCollapse) {
		// Vortex
		ctx.beginPath();
		if (doCollapse){
			// Collapsing
			ctx.strokeStyle=Colors.CYAN;
		}
		else if(this.radius < this.target_radius){
			// Growing
			ctx.strokeStyle=Colors.MAGENTA;
		}
		else{
			// Stable
			ctx.strokeStyle=Colors.GREEN;
		}
		for(theta = 0, angle_delta = (Math.PI * 2)/VortexLines; theta < ((Math.PI * 2)-0.001); theta += angle_delta){
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

		//Shield
		if (this.shieldActive){
			ctx.drawPolygon(this.shieldPolygon, this.center_x, this.center_y);
		}

	}
});