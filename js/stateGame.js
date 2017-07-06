var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateGame = Flynn.State.extend({

    SHIP_START_RADIUS: 250,
    SHIP_START_ANGLE: -Math.PI / 2,

    DRIFTER_MAX_RADIUS: 1024/2+30,
    DRIFTER_SPAWN_RATE: 0.005,
    DRIFTER_POINTS: 100,
    DRIFTER_COLLISION_RADIUS: 13,
    DRIFTER_NUM_EXPLOSION_PARTICLES: 20,

    BLOCKER_APPEAR_SCORE: 800,
    BLOCKER_SPAWN_RATE: 0.001,
    BLOCKER_POINTS: 250,
    BLOCKER_COLLISION_RADIUS: 13,
    BLOCKER_NUM_EXPLOSION_PARTICLES: 30,
    BLOCKER_CORE_EXPLOSION_PARTICLES: 10,

    SPAWN_OVERLAP_RETRIES: 16,
    OVERLAP_ANGLE_SPACING: Math.PI/16,

    REFLECTED_PROJECTILE_LIFE: 15,

    SHIP_BOUNCE_MIN_VELOCITY: 1.5,

    VORTEX_SHIELD_END_SCORE: 500,

    SHIP_NUM_EXPLOSION_PARTICLES: 50,
    SHIP_RESPAWN_DELAY_TICKS: 30,
    SHIP_RESPAWN_DELAY_GAME_START_TICKS: 60 * 1.25, // Respawn delay at inital start
    SHIP_RESPAWN_ANIMATION_TICKS: 60 * 1.8,
    SHIP_RESPAWN_SCALE_MAX: 35,
    SHIP_RESPAWN_SCALE_MIN: 0.1,
    SHIP_RESPAWN_ANGLE_MAX: Math.PI * 2 * 0.8,

    POP_UP_TEXT_LIFE: 3 * 60,
    POP_UP_THRUST_PROMPT_TIME: 4 * 60, //2 * 60,
    POP_UP_FIRE_PROMPT_TIME: 7 * 60, //5 * 60,
    POP_UP_CANCEL_TIME: 15, // Ticks to remove a pop-up when canceled

    EXTRA_LIFE_SCORE: 5000,

    PROJECTILES_MAX: 4,
    PROJECTILE_SIZE: 3,

    init: function() {
        this._super();
        
        this.center = new Victor(Game.CANVAS_WIDTH/2, Game.CANVAS_HEIGHT/2);

        this.vortex = new Game.Vortex(this.center);

        this.ship = new Game.Ship(Game.Points.WIDE_SHIP, Game.Points.FLAMES, 1.5, this.center,
            this.SHIP_START_RADIUS, this.SHIP_START_ANGLE, Flynn.Colors.YELLOW, this.vortex.radiusToAngularVelocity, this.vortex);
        this.ship.maxX = Game.CANVAS_WIDTH;
        this.ship.maxY = Game.CANVAS_HEIGHT;
        this.ship.visible = false; // Start invisible, to force respawn animation

        this.respawnPolygon = new Flynn.Polygon(
            Game.Points.RESPAWN,
            Flynn.Colors.YELLOW,
            1, //scale
            new Victor(0,0), // position
            false, // constrained
            true // is_world
            );
        this.respawnPolygon.setScale(1);
        this.shipRespawnX = this.center.x + this.SHIP_START_RADIUS * Math.cos(this.SHIP_START_ANGLE);
        this.shipRespawnY = this.center.y + this.SHIP_START_RADIUS * Math.sin(this.SHIP_START_ANGLE);

        this.gameOver = false;
        this.lives = 3;
        this.lifepolygon = new Flynn.Polygon(
            Game.Points.WIDE_SHIP, 
            Flynn.Colors.YELLOW,
            1.2, // scale
            new Victor(0, 50), // Position be set when rendering instances
            false, // constrained
            true // is_world
        );
        this.lifepolygon.setAngle(-Math.PI/2);

        Game.config.score = 0;
        Game.config.high_score = Game.config.leaderboard.getBestEntry().score;

        this.lvl = 0;

        this.generateLvl();
        
        this.vortexCollapse = false;

        // Game Clock
        this.gameClock = 0;

        // Timers
        Flynn.mcp.timers.add('shipRespawnDelay', this.SHIP_RESPAWN_DELAY_GAME_START_TICKS, null);  // Start game with a delay (for start sound to finish)
        Flynn.mcp.timers.add('shipRespawnAnimation', 0, null);
        this.shipRespawnDelayExpired = false;
        this.shipRespawnAnimationStarted = false;

        // Aliens
        this.drifters = [];
        this.blockers = [];

        // Vortex
        this.particles = new Game.Particles(this.center.x, this.center.y, this.vortex);
        this.vortex.particles = this.particles;

        // Pop-up messages
        this.popUpText = "";
        this.popUpText2 = null;
        this.popUpLife = 0;
        this.popUpThrustPending = true;
        this.popUpFirePending = true;
        this.popUpThrustActive = false;
        this.popUpFireActive = false;
        this.thrustHasOccurred = false;
        this.popupShieldErodePending = true;
    },

    generateLvl: function() {
        var margin = 20;

        this.ship.radius = this.SHIP_START_RADIUS;
        this.ship.radialAngle = this.SHIP_START_ANGLE;

        this.projectiles = new Flynn.Projectiles(
            new Flynn.Rect(0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT), 
            false // is_world
            );
        this.drifters = [];
        this.blockers = [];
    },

    addPoints: function(points){
        // Points only count when not dead
        if(this.ship.visible){
            if(Math.floor(Game.config.score / this.EXTRA_LIFE_SCORE) != Math.floor((Game.config.score + points) / this.EXTRA_LIFE_SCORE)){
                // Extra life
                this.lives++;
                Game.sounds.extra_life.play();
            }
            Game.config.score += points;
        }

        // Update highscore if exceeded
        if (Game.config.score > Game.config.high_score){
            Game.config.high_score = Game.config.score;
        }
    },

    showPopUp: function(popUpText, popUpText2){
        if(typeof(popUpText2)==='undefined'){
            popUpText2 = null;
        }

        this.popUpText = popUpText;
        this.popUpText2 = popUpText2;
        this.popUpLife = this.POP_UP_TEXT_LIFE;
    },

    doShipDie: function(){
        var i, len; 
        
        // Visibility
        this.ship.visible = false;

        // Lives
        this.lives--;
        if(this.lives <= 0){
            this.gameOver = true;
        }

        // Sounds
        Game.sounds.engine.stop();

        // Explosion
        if(!this.ship.deathByVortex){
            Game.sounds.player_die.play();
            this.particles.explosion(
                this.ship.radius, this.ship.radialAngle, this.SHIP_NUM_EXPLOSION_PARTICLES,
                this.ship.color, this.ship.EXPLOSION_MAX_VELOCITY);
        }

        // Timers
        Flynn.mcp.timers.set('shipRespawnDelay', this.SHIP_RESPAWN_DELAY_TICKS);
        Flynn.mcp.timers.set('shipRespawnAnimation', 0); // Set to zero to deactivate it
        this.shipRespawnDelayExpired = false;
        this.shipRespawnAnimationStarted = false;

        // Vortex
        this.vortexCollapse = true;
        // Make all enemies death dive to clear the play field
        for(i=0, len=this.drifters.length; i<len; i++){
            this.drifters[i].deathDive = true;
        }
        for(i=0, len=this.blockers.length; i<len; i++){
            this.blockers[i].deathDive = true;
        }
    },

    handleInputs: function(input, paceFactor) {

        if(Flynn.mcp.developerModeEnabled){
            // Metrics toggle
            if (input.virtualButtonWasPressed("dev_metrics")){
                Flynn.mcp.canvas.showMetrics = !Flynn.mcp.canvas.showMetrics;
            }

            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonWasPressed("dev_slow_mo")){
                Flynn.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonWasPressed("dev_fps_20")){
                Flynn.mcp.toggleDevPacingFps20();
            }

            // Points
            if (input.virtualButtonWasPressed("dev_add_points")){
                this.addPoints(100);
            }

            // Die
            if (input.virtualButtonWasPressed("dev_die")){
                this.doShipDie();
            }

            // Grow vortex
            if (input.virtualButtonWasPressed("vortex_grow")){
                this.vortex.grow(1);
            }
        }

        // Config
        if (input.virtualButtonWasPressed("UI_escape")){
            Flynn.mcp.changeState(Game.States.CONFIG);
        }
        
        if(!this.ship.visible){
            if (input.virtualButtonWasPressed("UI_enter")){
                if (this.gameOver){
                    if(Flynn.mcp.browserSupportsTouch){
                        // On touch devices just update high score and go back to menu
                        Game.config.leaderboard.add(
                                {  score: Game.config.score,
                                   name: "NONAME"
                                }
                            );
                        Flynn.mcp.changeState(Game.States.MENU);
                    } else {
                        Flynn.mcp.changeState(Game.States.END);
                    }
                    return;
                }
            }
            return;
        }


        if (input.virtualButtonIsDown("thrust")){
            this.thrustHasOccurred = true;
            this.popUpThrustPending = false;
            this.ship.addVel(paceFactor);
            if(!Game.sounds.engine.playing()){
                Game.sounds.engine.play();
            }

            // Cancel PopUp
            if(this.popUpThrustActive){
                this.popUpLife = Math.min(this.POP_UP_CANCEL_TIME, this.popUpLife);
            }
        } else {
            if (Game.sounds.engine.playing()){
                Game.sounds.engine.stop();
            }
        }

        if (input.virtualButtonWasPressed("fire")){
            this.popUpFirePending = false;

            // Limit max shots on screen 
            if(this.projectiles.projectiles.length < this.PROJECTILES_MAX){
                var projectile = this.ship.shoot();
                this.projectiles.add(
                    projectile.world_position_v,
                    projectile.velocity_v,
                    projectile.lifetime,
                    this.PROJECTILE_SIZE,
                    projectile.color
                    );
                this.projectiles.advanceFrame(); // Move the projectile one frame to get it away from the ship
            }

            // Cancel PopUp
            if(this.popUpFireActive){
                this.popUpLife = Math.min(this.POP_UP_CANCEL_TIME, this.popUpLife);
            }
        }

    },

    update: function(paceFactor) {
        var i, len, b, numOusideEnemies, outsideEnemyAngles;

        this.gameClock += paceFactor;

        if (this.ship.visible){
            // Update ship
            var isAlive = this.ship.update(
                paceFactor,
                this.vortex.radiusToAngularVelocity(this.ship.radius, true),
                this.vortex.radius);
            if(!isAlive){
                this.doShipDie();
            }
        }
        else{
            // Ship not visible
            if(!this.gameOver){
                if(Flynn.mcp.timers.hasExpired('shipRespawnDelay')){
                    this.shipRespawnDelayExpired = true;
                }

                if( (this.drifters.length === 0) &&
                    (this.blockers.length === 0) &&
                    this.shipRespawnDelayExpired &&
                    !this.shipRespawnAnimationStarted){

                    Flynn.mcp.timers.set('shipRespawnAnimation', this.SHIP_RESPAWN_ANIMATION_TICKS);
                    this.shipRespawnAnimationStarted = true;
                    Game.sounds.ship_respawn.play();
                }

                if(Flynn.mcp.timers.isRunning('shipRespawnAnimation')){
                    this.vortex.shieldAngleTarget = Flynn.Util.angleBound2Pi(this.SHIP_START_ANGLE);
                }

                // If respawn animation has finished...
                if(Flynn.mcp.timers.hasExpired('shipRespawnAnimation')){
                    // Respawn the ship
                    this.ship.radius = this.SHIP_START_RADIUS;
                    this.ship.radialAngle = this.SHIP_START_ANGLE;
                    this.ship.ascentVelocity = 0;
                    this.ship.visible = true;
                    this.ship.deathByVortex = false;
                    this.ship.update(
                        paceFactor,
                        this.vortex.radiusToAngularVelocity(this.ship.radius, true),
                        this.vortex.radius);
                }
            }
        }

        // Check projectile collisions
        for(var j=0, len2 = this.projectiles.projectiles.length; j<len2; j++){
            b = this.projectiles.projectiles[j];
            var bulletRemove = false;

            // Remove shots that reflect back into vortex
            if (Math.sqrt(Math.pow(b.position.x - this.center.x, 2) + Math.pow(b.position.y - this.center.y,2)) <= this.vortex.radius){
                bulletRemove = true;
            }

            // Shoot drifters
            for(var k=0, len3 =this.drifters.length; k<len3; k++){
                var drifter = this.drifters[k];
                if (Math.sqrt(Math.pow(drifter.position.x - b.position.x, 2) + Math.pow(drifter.position.y - b.position.y,2)) < this.DRIFTER_COLLISION_RADIUS){

                    this.addPoints(this.DRIFTER_POINTS);

                    // Explode
                    this.particles.explosion(drifter.radius, drifter.radialAngle, this.DRIFTER_NUM_EXPLOSION_PARTICLES, drifter.color);

                    // Remove dead drifter
                    Game.sounds.drifter_die.play();
                    this.drifters.splice(k, 1);
                    len3--;
                    k--;

                    bulletRemove = true;
                }
            }
            // Shoot blockers
            for(k=0, len3 =this.blockers.length; k<len3; k++){
                var blocker = this.blockers[k];
                if (Math.sqrt(Math.pow(blocker.position.x - b.position.x, 2) + Math.pow(blocker.position.y - b.position.y,2)) < this.BLOCKER_COLLISION_RADIUS){
                    // Reverse bullet direction
                    b.velocity.x =- b.velocity.x;
                    b.velocity.y =- b.velocity.y;
                    // Move the bullet after reflect, so that it cannot bounce around inside the blocker
                    b.position.x += b.velocity.x;
                    b.position.y += b.velocity.y;
                    b.lifetime = this.REFLECTED_PROJECTILE_LIFE;
                    Game.sounds.shot_reflect.play();
                }
            }
            if(bulletRemove){
                this.projectiles.projectiles.splice(j, 1);
                len2--;
                j--;
            }
        }


        // Update projectiles
        this.projectiles.update(paceFactor);

        // Update vortex
        var isCollapsed = this.vortex.update(paceFactor, this.vortexCollapse);
        if (isCollapsed){
            this.vortexCollapse = false;
        }

        //----------------
        // Drifers
        //----------------

        //Spawn
        if(!this.vortexCollapse && this.ship.visible){
            if((Math.random() < this.DRIFTER_SPAWN_RATE) || (this.drifters.length === 0)){
                var drifterRadius;
                var drifterAngle;
                if(this.drifters.length === 0){
                    // Start first drifter at one of the midscreen edges, so that it is immediately visisble
                    if (Math.random() > 0.5){
                        // Left/right
                        drifterRadius = this.center.x;
                        if (Math.random() > 0.5){
                            drifterAngle = 0;
                        }
                        else{
                            drifterAngle = Math.PI;
                        }
                    } else {
                        // Top/bottom
                        drifterRadius = this.center.y;
                        if (Math.random() > 0.5){
                            drifterAngle = Math.PI/2;
                        }
                        else{
                            drifterAngle = Math.PI*3/2;
                        }
                    }
                }
                else {
                    drifterRadius = this.DRIFTER_MAX_RADIUS;
                    drifterAngle =  Math.random() * Math.PI * 2;

                    // Make sure new drifter is not on top of an existing enemy
                    numOusideEnemies = 0;
                    outsideEnemyAngles = [];
                    for(i=0, len=this.drifters.length; i<len; i++){
                        if(this.drifters[i].radius > drifterRadius - (this.DRIFTER_COLLISION_RADIUS * 2)){
                            outsideEnemyAngles.push(Flynn.Util.angleBound2Pi(this.drifters[i].radialAngle));
                            ++numOusideEnemies;
                        }
                    }
                    for(i=0, len=this.blockers.length; i<len; i++){
                        if(this.blockers[i].radius > drifterRadius - (this.BLOCKER_COLLISION_RADIUS + this.DRIFTER_COLLISION_RADIUS)){
                            outsideEnemyAngles.push(Flynn.Util.angleBound2Pi(this.blockers[i].radialAngle));
                            ++numOusideEnemies;
                        }
                    }
                    if(numOusideEnemies > 0){
                        // Try this.SPAWN_OVERLAP_RETRIES times, then give up
                        for (i = 0; i<this.SPAWN_OVERLAP_RETRIES; i++){
                            overlapping = false;
                            for(j=0; j<numOusideEnemies; j++){
                                if(Math.abs(drifterAngle-outsideEnemyAngles[j]) < this.OVERLAP_ANGLE_SPACING){
                                    overlapping = true;
                                }
                            }
                            if(!overlapping){
                                break;
                            }
                            else {
                                drifterAngle = Flynn.Util.angleBound2Pi(drifterAngle + this.OVERLAP_ANGLE_SPACING);
                                //console.log("DEV: Advancing drifter spawn.");
                            }
                        }
                    }
                }

                // Create drifter
                drifter = new Game.Drifter(Game.Points.POINTY_SHIP, 2, this.center,
                    drifterRadius, drifterAngle, Flynn.Colors.RED,
                    this.vortex);
                this.drifters.push(drifter);
            }
        }

        // Update & check player collisions
        var numObjectsConsumed = 0;
        for(i=0, len=this.drifters.length; i<len; i++){
            numObjectsConsumed += this.drifters[i].update(paceFactor, this.vortex.radius);
            if(this.drifters[i].alive === false){
                // Remove dead drifter
                this.drifters.splice(i, 1);
                len--;
                i--;
            } else{
                if(this.ship.visible){
                    var d = this.drifters[i];
                    if (Math.sqrt(Math.pow(d.position.x - this.ship.position.x, 2) + Math.pow(d.position.y - this.ship.position.y,2)) < this.DRIFTER_COLLISION_RADIUS*2){
                        this.doShipDie();
                        this.particles.explosion(d.radius, d.radialAngle, this.DRIFTER_NUM_EXPLOSION_PARTICLES, d.color);
                        
                        // Remove dead drifter
                        this.drifters.splice(i, 1);
                        len--;
                        i--;
                    }
                }
            }
        }

        //----------------
        // Blockers
        //----------------

        //Spawn
        if(!this.vortexCollapse && this.ship.visible && Game.config.score >= this.BLOCKER_APPEAR_SCORE){
            if((Math.random() < this.BLOCKER_SPAWN_RATE) || (this.blockers.length === 0)){

                var blockerRadius = this.DRIFTER_MAX_RADIUS;
                var blockerAngle = Math.random() * Math.PI * 2;

                // Make sure new blocker is not on top of an existing enemy
                numOusideEnemies = 0;
                outsideEnemyAngles = [];
                for(i=0, len=this.drifters.length; i<len; i++){
                    if(this.drifters[i].radius > blockerRadius - (this.DRIFTER_COLLISION_RADIUS + this.BLOCKER_COLLISION_RADIUS)){
                        outsideEnemyAngles.push(Flynn.Util.angleBound2Pi(this.drifters[i].radialAngle));
                        ++numOusideEnemies;
                    }
                }
                for(i=0, len=this.blockers.length; i<len; i++){
                    if(this.blockers[i].radius > blockerRadius - (this.BLOCKER_COLLISION_RADIUS*2)){
                        outsideEnemyAngles.push(Flynn.Util.angleBound2Pi(this.blockers[i].radialAngle));
                        ++numOusideEnemies;
                    }
                }
                if(numOusideEnemies > 0){
                    // Try this.SPAWN_OVERLAP_RETRIES times, then give up
                    for (i = 0; i<this.SPAWN_OVERLAP_RETRIES; i++){
                        var overlapping = false;
                        for(j=0; j<numOusideEnemies; j++){
                            if(Math.abs(blockerAngle-outsideEnemyAngles[j]) < this.OVERLAP_ANGLE_SPACING){
                                overlapping = true;
                            }
                        }
                        if(!overlapping){
                            break;
                        }
                        else {
                            blockerAngle = Flynn.Util.angleBound2Pi(blockerAngle + this.OVERLAP_ANGLE_SPACING);
                        }
                    }
                }

                blocker = new Game.Blocker(Game.Points.SHIELD_TYPE_SHORT, Game.Points.SHIELD_CORE_SHORT, 2, this.center,
                    blockerRadius, blockerAngle, Flynn.Colors.RED,
                    this.vortex);
                this.blockers.push(blocker);
            }
        }

        // Update & check player collisions
        for(i=0, len=this.blockers.length; i<len; i++){
            numObjectsConsumed += this.blockers[i].update(paceFactor, this.vortex.radius);
            if(this.blockers[i].alive === false){
                // Remove dead blocker
                this.blockers.splice(i, 1);
                len--;
                i--;
            } else{
                if(this.ship.visible){
                    d = this.blockers[i];
                    if (Math.sqrt(Math.pow(d.position.x - this.ship.position.x, 2) + Math.pow(d.position.y - this.ship.position.y,2)) < this.BLOCKER_COLLISION_RADIUS*2){
                        if(this.ship.radius > d.radius){
                            // Ship destroys blocker
                            Game.sounds.blocker_die.play();
                            this.addPoints(this.BLOCKER_POINTS);

                            // Bounce the ship
                            this.ship.ascentVelocity = this.SHIP_BOUNCE_MIN_VELOCITY;
                        }
                        else {
                            // Blocker destroys ship
                            this.doShipDie();
                        }

                        // Explosion
                        this.particles.explosion(d.radius, d.radialAngle, this.BLOCKER_NUM_EXPLOSION_PARTICLES, d.color);
                        this.particles.explosion(d.radius, d.radialAngle, this.BLOCKER_CORE_EXPLOSION_PARTICLES, d.core.color);
                        
                        // Remove dead blocker
                        this.blockers.splice(i, 1);
                        len--;
                        i--;
                    }
                }
            }
        }

        //-------------------
        // PopUps
        //-------------------
        // Life
        var oldPopUpLife = this.popUpLife;
        this.popUpLife -= paceFactor;

        // Expiration
        if ((this.popUpLife <= 0) && (oldPopUpLife > 0)){
            // PopUp Expired
            this.popUpThrustActive = false;
            this.popUpFireActive = false;
        }

        // Generation
        if(this.popUpThrustPending){
            if (this.gameClock >= this.POP_UP_THRUST_PROMPT_TIME)
            {
                this.popUpThrustPending = false;
                this.popUpThrustActive = true;
                this.showPopUp(Game.config.thrustPrompt);
                this.popUpLife = this.POP_UP_TEXT_LIFE;
            }
        }
        if (this.popUpFirePending && this.thrustHasOccurred){
            if (this.gameClock >= this.POP_UP_FIRE_PROMPT_TIME)
            {
                this.popUpFirePending = false;
                this.popUpFireActive = true;
                this.showPopUp(Game.config.shootPrompt);
                this.popUpLife = this.POP_UP_TEXT_LIFE;
            }
        }
        if (this.vortex.shieldErode && this.popupShieldErodePending){
            this.popupShieldErodePending = false;
            this.showPopUp("SHIELD COLLAPSE", "AVOID VORTEX");
            this.popUpLife = this.POP_UP_TEXT_LIFE;
        }

        // Vortex grow
        if(numObjectsConsumed>0){
            if(!this.vortexCollapse && this.ship.visible){
                this.vortex.grow(numObjectsConsumed);
            }
        }

        // Vortex shield
        if(Game.config.score >= this.VORTEX_SHIELD_END_SCORE){
            this.vortex.shieldErode = true;
        }

        // Particles
        this.particles.update(paceFactor);
    },

    render: function(ctx){
        var i, len;
        ctx.clearAll();

        // DEBUG: Show number of stars
        //ctx.vectorText(this.vortex.stars.length, 3,300,15,null, Flynn.Colors.GREEN);

        // Scores
        ctx.vectorText(Game.config.score, 3, 15, 15, 'left', Flynn.Colors.YELLOW);
        ctx.vectorText(Game.config.high_score, 3, Game.CANVAS_WIDTH - 6  , 15, 'right' , Flynn.Colors.YELLOW);

        // Extra Lives
        for(i=0; i<this.lives; i++){
            this.lifepolygon.position.x = 25+25*i;
            this.lifepolygon.render(ctx);
        }

        // PopUp Text
        if(this.popUpLife > 0){
            ctx.vectorTextArc(this.popUpText,
                3, this.vortex.center.x, this.vortex.center.y,
                Math.PI*3/2, 150, Flynn.Colors.YELLOW, true, false);
            if(this.popUpText2){
                ctx.vectorTextArc(this.popUpText2,
                    3, this.vortex.center.x, this.vortex.center.y,
                    Math.PI/2, 150, Flynn.Colors.YELLOW, true, true);
            }
        }

        // projectiles
        this.projectiles.render(ctx);

        // Drifters
        for(i=0, len=this.drifters.length; i<len; i++){
            this.drifters[i].render(ctx);
        }

        // Blockers
        for(i=0, len=this.blockers.length; i<len; i++){
            this.blockers[i].render(ctx);
        }

        // Player
        this.ship.render(ctx);

        // Vortex
        var showCollapse = (this.vortexCollapse || (this.ship.visible === false && this.drifters.length > 0));
        this.vortex.render(ctx, showCollapse);

        // Particles
        this.particles.render(ctx);

        // Ship respawn animation
        if(Flynn.mcp.timers.isRunning('shipRespawnAnimation')){
            var animationPercentage = Flynn.mcp.timers.get('shipRespawnAnimation') / this.SHIP_RESPAWN_ANIMATION_TICKS;
            var sizePercentageStep = 0.005;
            var rotationPercentageStep = 0.1;
            // for(i=0; i<9; i++){
            //  var sizePercentage = animationPercentage + i*sizePercentageStep;
            //  var rotationPercentage = animationPercentage + i*rotationPercentageStep;
            //  //if (percentage < 0){
            //  //  percentage = 0.1;
            //  //}
            //  this.respawnPolygon.setScale((this.SHIP_RESPAWN_SCALE_MIN + (this.SHIP_RESPAWN_SCALE_MAX - this.SHIP_RESPAWN_SCALE_MIN)*sizePercentage));
            //  this.respawnPolygon.setAngle(this.SHIP_RESPAWN_ANGLE_MAX * rotationPercentage);
            //  ctx.drawPolygon(this.respawnPolygon, this.shipRespawnX, this.shipRespawnY);
            // }
            var startRadius = 200 * animationPercentage;
            var numParticles = 100 * (1-animationPercentage);
            var startAngle = Math.PI * 1 * animationPercentage;
            var angleStep = Math.PI * 8 / 100;
            var radiusStep = 2 * animationPercentage;
            ctx.fillStyle=Flynn.Colors.YELLOW;
            for(i=0; i<numParticles; i++){
                var angle = startAngle + i * angleStep;
                var radius = startRadius + radiusStep * i;
                var x = this.shipRespawnX + Math.cos(angle) * radius;
                var y = this.shipRespawnY + Math.sin(angle) * radius;
                ctx.fillRect(x,y,2,2);
            }
        }

        // Game OVer
        if(this.gameOver){
            ctx.vectorText("GAME OVER", 6, null, 200, null, Flynn.Colors.GREEN);
            ctx.vectorText("PRESS <ENTER>", 2, null, 250, null, Flynn.Colors.GREEN);
        }
    }
});

}()); // "use strict" wrapper