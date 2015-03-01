var ExplosionMaxVelocity = 0.5;
var ParticleLife = 50;
var ParticleLifeVariation = 20;
var ParticleFriction = 0.99;
var ParticleGravity = -0.01;

var Particle = Class.extend({
    init: function(particles, radius, angle, dx, dy, color, f_radiusToAngularVelocity){
        this.particles = particles;
        this.radius = radius;
        this.angle = angle;
        this.dx = dx;
        this.dy = dy;
        this.x = 0;
        this.y = 0;
        this.color = color;
        this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

        this.life = ParticleLife + (Math.random()-0.5) * ParticleLifeVariation;
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
            var angularVelocity = this.f_radiusToAngularVelocity(this.radius, false); // BUG: Boost doesn't work here. Calling without
            // Apply angular velocity
            this.angle += angularVelocity * paceFactor;
            // Apply radius decay
            this.radiusDecayVelocity += ParticleGravity;
            this.radius += this.radiusDecayVelocity;
            // Get cartesian position
            this.x = this.particles.center_x + Math.cos(this.angle) * this.radius;
            this.y = this.particles.center_y + Math.sin(this.angle) * this.radius;
            // Add impulse
            this.x += this.dx * paceFactor;
            this.y += this.dy * paceFactor;
            // Decay impulse
            this.dx *= ParticleFriction;
            this.dy *= ParticleFriction;
            // Convert back to polar coordinates
            this.angle = Math.atan2(this.y-this.particles.center_y, this.x-this.particles.center_x);
            this.radius = Math.sqrt(Math.pow(this.y-this.particles.center_y,2) + Math.pow(this.x-this.particles.center_x,2));

        }
        return isAlive;
    },

    draw: function(ctx) {
        ctx.fillStyle=this.color;
        ctx.fillRect(this.x,this.y,2,2);
    }

});

var Particles = Class.extend({

    init: function(center_x, center_y, f_radiusToAngularVelocity){
        this.center_x = center_x;
        this.center_y = center_y;
        this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

        this.particles=[];
    },

    explosion: function(radius, angle, quantity, color) {
        for(var i=0; i<quantity; i++){
            theta = Math.random() * Math.PI * 2;
            velocity = Math.random() * ExplosionMaxVelocity;
            this.particles.push(new Particle(
                this,
                radius,
                angle,
                Math.cos(theta) * velocity,
                Math.sin(theta) * velocity,
                color,
                this.f_radiusToAngularVelocity
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

    draw: function(ctx) {
        for(var i=0, len=this.particles.length; i<len; i+=1){
            this.particles[i].draw(ctx);
        }
    }
});