if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.Blocker = Flynn.Polygon.extend({

    FALL_SPEED: 0.6,
    
    init: function(p, p2, s, x, y, radius, radialAngle, color, vortex){
        this._super(
            p,
            color,
            s, // scale
            {x:x, y:y, is_world:false}
            );


        this.core = new Flynn.Polygon(
            p2,
            Flynn.Colors.CYAN,
            s, // scale
            {x:x, y:y, is_world:false}
            );

        this.center_x = x;
        this.center_y = y;
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
        this.position.x = this.center_x + this.radius * Math.cos(this.radialAngle);
        this.position.y = this.center_y + this.radius * Math.sin(this.radialAngle);
    },

    collide: function(polygon){
        if (!this.visible){
            return false;
        }
        for(i=0, len=this.points.length -2; i<len; i+=2){
            var x = this.points[i] + this.position.x;
            var y = this.points[i+1] + this.position.y;

            if (polygon.hasPoint(x,y)){
                return true;
            }
        }
        return false;
    },

    hasPoint: function(x, y) {
        return this._super(this.position.x, this.position.y, x, y);
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
        
        // ctx.drawPolygon(this, this.position.x, this.position.y);
        // ctx.drawPolygon(this.core, this.position.x, this.position.y);
        
        //Colision radius visualization
        //ctx.beginPath();
        //ctx.arc(this.position.x,this.position.y,13,0,2*Math.PI);
        //ctx.stroke();
    }
});