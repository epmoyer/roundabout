var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.Ship = Flynn.Polygon.extend({

    GRAVITY: 0.08,
    THRUST: 0.57, //0.4
    RECOIL: 1.0,
    MAX_RADIUS: 370,
    BULLET_VELOCITY: 5,
    BULLET_LIFE: 60 * 30, // 30 seconds
    EXPLOSION_MAX_VELOCITY: 0.8,

    maxX: null,
    maxY: null,

    init: function(p, pf, s, center, radius, radialAngle, color, f_radiusToAngularVelocity, vortex){
        this._super(
            p,
            color,
            s, // scale
            center,
            false, // constrained
            true // is_world
            );

        this.flames = new Flynn.Polygon(
            pf,
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
        this.ascentVelocity = 0;
        this.angularVelocity = 0;
        this.vortex = vortex;

        this.position.x = null;
        this.position.y = null;

        this.drawFlames = false;
        this.visible = true;
        this.deathByVortex = false;

        this.radial_to_cardinal();
        this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

        this.vel = {
            x: 0,
            y: 0
        };
    },

    // Calculate cardinal position and angle from radial position and angle
    radial_to_cardinal: function(){
        this.setAngle(this.radialAngle);
        this.flames.setAngle(this.radialAngle);
        this.position.x = this.center.x + this.radius * Math.cos(this.radialAngle);
        this.position.y = this.center.y + this.radius * Math.sin(this.radialAngle);
    },

    shoot: function() {
        Game.sounds.shoot.play();

        var projectile_info = {};
        var b_advance_angle = this.angularVelocity; // start bullet angle one animation frame forward
        projectile_info.world_position_v = new Victor(
            this.center.x + this.radius * Math.cos(this.radialAngle + b_advance_angle) + this.points[0],
            this.center.y + this.radius * Math.sin(this.radialAngle + b_advance_angle) + this.points[1]);
        projectile_info.velocity_v = new Victor(
            Math.cos(this.radialAngle + b_advance_angle) * this.BULLET_VELOCITY,
            Math.sin(this.radialAngle + b_advance_angle) * this.BULLET_VELOCITY);
        projectile_info.lifetime = this.BULLET_LIFE;
        projectile_info.color = this.color;
        projectile_info.maxX = this.maxX;
        projectile_info.maxY = this.maxY;

        //Recoil
        this.ascentVelocity -= this.RECOIL;
        return projectile_info;
    },

    addVel: function(paceFactor) {
        this.ascentVelocity += this.THRUST * paceFactor;
        this.drawFlames = true;
    },

    update: function(paceFactor, angularVelocity, vortexRadius) {
        var isAlive = true;

        //console.log(paceFactor);
        this.angularVelocity = angularVelocity;
        this.ascentVelocity -= this.GRAVITY * paceFactor;
        this.radius += this.ascentVelocity * paceFactor;

        // Do not descend below vortex shield (if active)
        if (this.vortex.shieldActive){
            if(this.radius < this.vortex.shieldRadius){
                this.radius = this.vortex.shieldRadius;
                this.ascentVelocity = 0;
            }
        }

        // Die if fall into vortex
        if (this.radius < vortexRadius){
            if(this.visible){
                this.ascentVelocity = 0;
                this.radius = vortexRadius;
                Game.sounds.vortex_consume_player.play();
                this.deathByVortex = true;
                isAlive = false;
            }
        }

        // Do not fly past max raius
        if (this.radius > this.MAX_RADIUS){
            this.ascentVelocity = 0;
            this.radius = this.MAX_RADIUS;
        }
        this.radialAngle += angularVelocity * paceFactor;
        this.radial_to_cardinal();

        // Update vortex shield angle to match ship
        this.vortex.shieldAngleTarget = Flynn.Util.angleBound2Pi(this.radialAngle);

        return isAlive;
    },

    render: function(ctx){
        if(this.visible){
            this._super(ctx);
        

            //ctx.drawPolygon(this, this.position.x, this.position.y);
            if (this.drawFlames){
                this.flames.position.x = this.position.x;
                this.flames.position.y = this.position.y;
                this.flames.render(ctx);
                //ctx.drawPolygon(this.flames, this.position.x, this.position.y);
                this.drawFlames = false;
            }
        }
    }
});

}()); // "use strict" wrapper