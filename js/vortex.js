var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.Vortex = Class.extend({

    VORTEX_LINES: 15,
    VORTEX_THICKNESS: 15,
    VORTEX_START_RADIUS: 20,
    VORTEX_MAX_RADIUS: 350,
    VORTEX_RADIAL_SPEED: -0.06,
    VORTEX_TWIST: 0.20,
    VORTEX_GROW_RADIUS: 10,
    VORTEX_GROW_RATE: 0.23,
    VORTEX_COLLAPSE_RATE: 1.0,
    VORTEX_BOOST_RANGE: 70,
    VORTEX_BOOST_VELOCITY: 0.06,
    VORTEX_SHIELD_POINTS: 18,
    VORTEX_SHIELD_MARGIN: 15,
    VORTEX_SHIELD_DRAW_MARGIN: 3,
    VORTEX_SHIELD_ERODE_TIME: 30,
    VORTEX_SHIELD_ANGULAR_SPEED: Math.PI/40,
    STAR_MAX_RADIUS: 1024/2,
    STARFALL_SPEED: 0.3,
    STAR_SPAWN_RATE: 0.07,
    STAR_NUM_MAX: 100,

    init: function(x, y){
        this.target_radius = this.VORTEX_START_RADIUS;
        this.angle = 0;
        this.center_x = x;
        this.center_y = y;

        this.stars = [];
        for (var i=0; i<this.STAR_NUM_MAX; i++){
            this.stars.push(Math.random() * this.STAR_MAX_RADIUS);
            this.stars.push(Math.random() * Math.PI * 2);
        }

        // Build shield 
        var shieldPoints = [];
        for (var theta=0; theta<Math.PI+0.01; theta+=Math.PI*2/this.VORTEX_SHIELD_POINTS){
            shieldPoints.push(Math.cos(theta-Math.PI/2));
            shieldPoints.push(Math.sin(theta-Math.PI/2));
        }
        this.shieldPolygon = new Flynn.Polygon(
            shieldPoints,
            Flynn.Colors.CYAN,
            1, // scale (Temporary; Will be overwritten)
            {   x:this.center_x, // Will be set when rendering instances
                y:this.center_y, 
                is_world:false}
            );
        this.shieldAngleTarget = -Math.PI/2;
        this.shieldAngle = -Math.PI/2;
        this.shieldActive = true;
        this.shieldPolygon.setAngle(this.shieldAngle);
        this.shieldErodeTimer = this.VORTEX_SHIELD_ERODE_TIME;
        this.shieldErode = false;

        this.setRadius(this.VORTEX_START_RADIUS);
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
            if(distanceFromVortex<this.VORTEX_BOOST_RANGE){
                boostVelocity = this.VORTEX_BOOST_VELOCITY * ((this.VORTEX_BOOST_RANGE - distanceFromVortex)/this.VORTEX_BOOST_RANGE);
            }
        }
        return -((0.03 * ((this.STAR_MAX_RADIUS - distance)/this.STAR_MAX_RADIUS)) + boostVelocity);
    },

    setRadius: function(radius){
        this.radius = radius;
        this.shieldRadius = radius + this.VORTEX_SHIELD_MARGIN;
        this.shieldPolygon.setScale(this.shieldRadius - this.VORTEX_SHIELD_DRAW_MARGIN);
    },

    grow: function(objectsConsumed) {
        this.target_radius += this.VORTEX_GROW_RADIUS * objectsConsumed;
        if (this.target_radius >= this.VORTEX_MAX_RADIUS){
            this.target_radius = this.VORTEX_MAX_RADIUS;
        }
        Game.sounds.vortex_consume.play();
    },

    caresianToAngle: function (x, y) {
        return Math.atan2(y-this.center_y, x-this.center_x);
    },

    cartesianToRadius: function (x, y) {
        return Math.sqrt(Math.pow(y-this.center_y,2) + Math.pow(x-this.center_x,2));
    },

    update: function(paceFactor, doCollapse) {
        var isCollapsed = false;
        var x, y;

        this.angle += this.VORTEX_RADIAL_SPEED * paceFactor;

        if(this.shieldAngle != this.shieldAngleTarget){
            var angleStep = -this.VORTEX_SHIELD_ANGULAR_SPEED * paceFactor;
            var separation = this.shieldAngleTarget - this.shieldAngle;
            if((separation > 0) && (separation < Math.PI*5/6)){
                angleStep = -angleStep;
            }
            this.shieldAngle = Flynn.Util.angleBound2Pi(this.shieldAngle + angleStep);
            this.shieldPolygon.setAngle(this.shieldAngle);
        }

        if (doCollapse){
            this.target_radius = this.VORTEX_START_RADIUS;
            this.setRadius(this.radius - this.VORTEX_COLLAPSE_RATE * paceFactor);
            if (this.radius <= this.VORTEX_START_RADIUS){
                this.setRadius(this.VORTEX_START_RADIUS);
                isCollapsed = true;
            }
        }
        else{
            if(this.radius < this.target_radius){
                this.setRadius(this.radius + this.VORTEX_GROW_RATE * paceFactor);
            }
        }

        //-----------
        // Stars
        //-----------
        // Add rotational angle to stars based on radius
        for(var i=0, len=this.stars.length; i<len; i+=2){
            this.stars[i+1] += this.radiusToAngularVelocity(this.stars[i], true) * paceFactor;
            this.stars[i] -= this.STARFALL_SPEED * paceFactor;
            if (this.stars[i] < (this.radius + this.VORTEX_THICKNESS/2)){
                // Star fell into the vortex, so remove it
                this.stars.splice(i,2);
                i-=2;
                len-=2;
            }
        }
        // Spawn
        if(this.stars.length < this.STAR_NUM_MAX*2){
            if(Math.random() * paceFactor < this.STAR_SPAWN_RATE){
                this.stars.push(Math.random() * this.STAR_MAX_RADIUS);
                this.stars.push(Math.random() * Math.PI * 2);
            }
        }

        // Update shield
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
                            Flynn.Colors.CYAN);
                        x = this.shieldPolygon.points[len-4];
                        y = this.shieldPolygon.points[len-3];
                        this.particles.explosion(
                            this.shieldRadius,
                            Math.atan2(y,x),
                            10,
                            Flynn.Colors.CYAN);
                        Game.sounds.shield_erode.play();
                    }
                    this.shieldPolygon.pointsMaster.splice(len-2,2);
                    this.shieldPolygon.points.splice(len-2,2);
                    this.shieldPolygon.pointsMaster.splice(0,2);
                    this.shieldPolygon.points.splice(0,2);
                    this.shieldErodeTimer = this.VORTEX_SHIELD_ERODE_TIME;
                }else{
                    // Shield eroded.
                    this.shieldActive = false;
                }
            }
        }

        return isCollapsed;
    },

    render: function(ctx, doCollapse) {
        // Vortex
        if (doCollapse){
            // Collapsing
            ctx.vectorStart(Flynn.Colors.CYAN);
        }
        else if(this.radius < this.target_radius){
            // Growing
            ctx.vectorStart(Flynn.Colors.MAGENTA);
        }
        else{
            // Stable
            ctx.vectorStart(Flynn.Colors.GREEN);
        }
        for(var theta = 0, angle_delta = (Math.PI * 2)/this.VORTEX_LINES; theta < ((Math.PI * 2)-0.001); theta += angle_delta){
            var sx = this.center_x + Math.cos(theta+this.angle - this.VORTEX_TWIST) * (this.radius - this.VORTEX_THICKNESS/2);
            var sy = this.center_y + Math.sin(theta+this.angle - this.VORTEX_TWIST) * (this.radius - this.VORTEX_THICKNESS/2);
            var ex = this.center_x + Math.cos(theta+this.angle + this.VORTEX_TWIST) * (this.radius + this.VORTEX_THICKNESS/2);
            var ey = this.center_y + Math.sin(theta+this.angle + this.VORTEX_TWIST) * (this.radius + this.VORTEX_THICKNESS/2);
            ctx.vectorMoveTo(sx,sy);
            ctx.vectorLineTo(ex,ey);
        }
        ctx.vectorEnd();

        // Stars
        ctx.fillStyle="#808080";
        for(var i=0, len=this.stars.length; i<len; i+=2){
            var radius = this.stars[i];
            var angle = this.stars[i+1];
            var x = this.center_x + Math.cos(angle) * radius;
            var y = this.center_y + Math.sin(angle) * radius;
            ctx.fillRect(x,y,2,2);
        }

        //Shield
        if (this.shieldActive){
            this.shieldPolygon.render(ctx);
        }

    }
});

}()); // "use strict" wrapper