if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

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

    init: function(p, pf, s, x, y, radius, radialAngle, color, f_radiusToAngularVelocity, vortex){
        this._super(p, color);

        this.flames = new Flynn.Polygon(pf, Flynn.Colors.CYAN);
        this.flames.setScale(s);

        this.center_x = x;
        this.center_y = y;
        this.radius = radius;
        this.radialAngle = radialAngle;
        this.angle = 0;
        this.scale = s;
        this.ascentVelocity = 0;
        this.angularVelocity = 0;
        this.vortex = vortex;

        this.x = null;
        this.y = null;

        this.drawFlames = false;
        this.visible = true;
        this.deathByVortex = false;

        this.setScale(s);
        this.radial_to_cardinal();
        this.f_radiusToAngularVelocity = f_radiusToAngularVelocity;

        this.vel = {
            x: 0,
            y: 0
        };

        this.soundShoot = new Howl({
            src: ['sounds/Laser_Shoot_sustained.ogg', 'sounds/Laser_Shoot_sustained.mp3'],
            volume: 0.25,
        });

        this.soundVortexConsumePlayer = new Howl({
            src: ['sounds/VortexConsume.ogg', 'sounds/VortexConsume.mp3'],
            volume: 0.50,
        });
    },

    // Calculate caridnal position and angle from radial position and angle
    radial_to_cardinal: function(){
        this.setAngle(this.radialAngle);
        this.flames.setAngle(this.radialAngle);
        this.x = this.center_x + this.radius * Math.cos(this.radialAngle);
        this.y = this.center_y + this.radius * Math.sin(this.radialAngle);
    },

    collide: function(polygon){
        if (!this.visible){
            return false;
        }
        for(i=0, len=this.points.length -2; i<len; i+=2){
            var x = this.points[i] + this.x;
            var y = this.points[i+1] + this.y;

            if (polygon.hasPoint(x,y)){
                return true;
            }
        }
        return false;
    },

    hasPoint: function(x, y) {
        return this._super(this.x, this.y, x, y);
    },

    shoot: function() {
        this.soundShoot.play();

        var projectile_info = {};
        var b_advance_angle = this.angularVelocity; // start bullet angle one animation frame forward
        projectile_info.world_position_v = new Victor(
            this.center_x + this.radius * Math.cos(this.radialAngle + b_advance_angle) + this.points[0],
            this.center_y + this.radius * Math.sin(this.radialAngle + b_advance_angle) + this.points[1]);
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
                this.soundVortexConsumePlayer.play();
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

    draw: function(ctx){
        if(this.visible){
            ctx.drawPolygon(this, this.x, this.y);
            if (this.drawFlames){
                ctx.drawPolygon(this.flames, this.x, this.y);
                this.drawFlames = false;
            }
        }
    }
});