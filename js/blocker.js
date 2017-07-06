var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.Blocker = Flynn.Polygon.extend({

    FALL_SPEED: 0.6,
    
    init: function(p, p2, s, center, radius, radialAngle, color, vortex){
        this._super(
            p,
            color,
            s, // scale
            center,
            false, // constrained
            true // is_world
            );

        this.core = new Flynn.Polygon(
            p2,
            Flynn.Colors.CYAN,
            s, // scale
            center,
            false, // constrained
            true // is_world
            );

        this.center = center;
        this.radius = radius;
        this.radialAngle = radialAngle;
        this.angle = 0;
        this.scale = s;

        this.position.x = null;
        this.position.y = null;

        this.setScale(s);
        this.radial_to_cardinal();
        this.alive = true;
        this.deathDive = false;
        this.vortex = vortex;
    },

    // Calculate caridnal position and angle from radial position and angle
    radial_to_cardinal: function(){
        this.setAngle(this.radialAngle + Math.PI);
        this.core.setAngle(this.radialAngle + Math.PI);
        this.position.x = this.center.x + this.radius * Math.cos(this.radialAngle);
        this.position.y = this.center.y + this.radius * Math.sin(this.radialAngle);
    },

    update: function(paceFactor, vortexRadius) {
        var numVortexed = 0;
        // Add rotational angle based on radius
        this.radialAngle += this.vortex.radiusToAngularVelocity(this.radius) * paceFactor;
        if(this.deathDive){
            this.radius -= 12 * this.FALL_SPEED * paceFactor;
        }
        else {
            this.radius -= this.FALL_SPEED * paceFactor;
        }
        this.radial_to_cardinal();
        if (this.radius < vortexRadius){
            // Drifter fell into the vortex, so regenerate it at the outside
            this.alive = false;
            ++numVortexed;
        }
        return numVortexed;
    },

    render: function(ctx){
        this._super(ctx);

        this.core.position.x = this.position.x;
        this.core.position.y = this.position.y;
        this.core.render(ctx);
        
        //Colision radius visualization
        //ctx.beginPath();
        //ctx.arc(this.position.x,this.position.y,13,0,2*Math.PI);
        //ctx.stroke();
    }
});

}()); // "use strict" wrapper