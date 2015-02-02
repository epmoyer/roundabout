var BulletVelocity = 5;

var Bullet = Class.extend({
	maxX: null,
	maxY: null,

	init: function(x, y, angle){
		this.x = x;
		this.y = y;

		this.shallRemove = false;
		this.life = 60 * 30; // 30 seconds of life to start

		this.vel = {
			x: BulletVelocity * Math.cos(angle),
			y: BulletVelocity * Math.sin(angle)
		}
	},

	update: function(paceFactor){
		this.prevx = this.x;
		this.prevy = this.y;

		if (0 > this.x || this.x > this.maxX ||
			0 > this.y || this.y > this.maxY
		){
			this.shallRemove = true;
		}
		//console.log(paceFactor, this.x + this.vel.x * paceFactor, this.x + this.vel.x * 0.5);
		this.x += this.vel.x * paceFactor;
		this.y += this.vel.y * paceFactor;
		
		if(--this.life <= 0){
			this.shallRemove = true;
		}
	},

	draw: function(ctx) {
		ctx.beginPath();
		ctx.moveTo(this.prevx, this.prevy);
		ctx.lineTo(this.x, this.y);
		ctx.stroke();
	}
});