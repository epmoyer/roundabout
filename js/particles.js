if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.Particle = Class.extend({

    PARTICLE_LIFE: 50,
    PARTICLE_LIFE_VARIATION: 20,
    PARTICLE_FRICTION: 0.99,
    PARTICLE_GRAVITY: -0.01,

    init: function(particles, radius, angle, dx, dy, color, vortex){
        this.particles = particles;
        this.radius = radius;
        this.angle = angle;
        this.dx = dx;
        this.dy = dy;
        this.x = 0;
        this.y = 0;
        this.color = color;
        this.vortex = vortex;

        this.life = this.PARTICLE_LIFE + (Math.random()-0.5) * this.PARTICLE_LIFE_VARIATION;
        this.radiusDecayVelocity = 0;
    },

    update: function(paceFactor) {
        var isAlive = true;
        // Decay and die
        this.life -= paceFactor;
        if(this.life <= 0){
            // Kill particle
            isAlive = false;
        }
        else{
            // Get angular velocity
            var angularVelocity = this.vortex.radiusToAngularVelocity(this.radius, false); // BUG: Boost doesn't work here. Calling without
            // Apply angular velocity
            this.angle += angularVelocity * paceFactor;
            // Apply radius decay
            this.radiusDecayVelocity += this.PARTICLE_GRAVITY * paceFactor;
            this.radius += this.radiusDecayVelocity * paceFactor;
            // Get cartesian position
            this.x = this.particles.center_x + Math.cos(this.angle) * this.radius;
            this.y = this.particles.center_y + Math.sin(this.angle) * this.radius;
            // Add impulse
            this.x += this.dx * paceFactor;
            this.y += this.dy * paceFactor;
            // Decay impulse
            var pacedFriction = Math.pow(this.PARTICLE_FRICTION, paceFactor);
            this.dx *= pacedFriction;
            this.dy *= pacedFriction;
            // Convert back to polar coordinates
            this.angle = Math.atan2(this.y-this.particles.center_y, this.x-this.particles.center_x);
            this.radius = Math.sqrt(Math.pow(this.y-this.particles.center_y,2) + Math.pow(this.x-this.particles.center_x,2));

        }
        return isAlive;
    },

    render: function(ctx) {
        ctx.fillStyle=this.color;
        ctx.fillRect(this.x,this.y,2,2);
    }

});

Game.Particles = Class.extend({

    DEFAULT_EXPLOSION_MAX_VELOCITY: 0.5,
    
    init: function(center_x, center_y, vortex){
        this.center_x = center_x;
        this.center_y = center_y;
        this.vortex = vortex;

        this.particles=[];
    },

    explosion: function(radius, angle, quantity, color, maxVelocity) {
        if(typeof(maxVelocity)==='undefined'){
            maxVelocity = this.DEFAULT_EXPLOSION_MAX_VELOCITY;
        }
        for(var i=0; i<quantity; i++){
            var theta = Math.random() * Math.PI * 2;
            var velocity = Math.random() * maxVelocity;
            this.particles.push(new Game.Particle(
                this,
                radius,
                angle,
                Math.cos(theta) * velocity,
                Math.sin(theta) * velocity,
                color,
                this.vortex
            ));
        }
    },

    update: function(paceFactor) {
        for(var i=0, len=this.particles.length; i<len; i+=1){
            if(!this.particles[i].update(paceFactor)){
                // Particle has died.  Remove it
                this.particles.splice(i, 1);
                len--;
                i--;
            }
        }
    },

    render: function(ctx) {
        for(var i=0, len=this.particles.length; i<len; i+=1){
            this.particles[i].render(ctx);
        }
    }
});