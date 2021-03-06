var Game = Game || {}; // Create namespace

(function () { "use strict";

Game.StateMenu = Flynn.State.extend({

    TITLE_ANGULAR_VELOCITY:    -0.01,
    CREDITS_ANGULAR_VELOCITY:  -0.013,
    CREDITS_ANGULAR_VELOCITY3: -0.020,
    CREDITS_ANGULAR_VELOCITY4: -0.027,
    CREDITS_ANGULAR_VELOCITY5: -0.031,
    IS_CENTERED: true,
    VIEW_PHASES:{
        NORMAL: 0,
        SCORES: 1,
        CREDITS: 2,
    },
    VIEW_PHASE_TICKS_NORMAL: 60 * 7,
    VIEW_PHASE_TICKS_SCORES: 60 * 4,
    VIEW_PHASE_TICKS_CREDITS: 60 * 4,

    init: function(){

        this.canvasWidth = Flynn.mcp.canvas.ctx.width;
        this.canvasHeight = Flynn.mcp.canvas.ctx.height;
        this.center = new Victor(this.canvasWidth/2, this.canvasHeight/2);

        this.vortex = new Game.Vortex(this.center);
        this.vortex.shieldActive = false;

        this.titleAngle = (Math.PI*2) * (210/360);
        this.creditsAngle = 0;
        this.creditsAngle2 = 2 * Math.PI/4;
        this.creditsAngle2B = 3 * Math.PI/4;
        this.creditsAngle3 = Math.PI/4;
        this.creditsAngle4 = Math.PI/4;
        this.creditsAngle5 = Math.PI/4;

        this.view_phase = this.VIEW_PHASES.NORMAL;

        this.timers = new Flynn.Timers();
        this.timers.add("view_phase", this.VIEW_PHASE_TICKS_NORMAL, null);

        this.va_logo = new Flynn.VALogo(
            new Victor(60, Flynn.mcp.canvasHeight - 60),
            1,
            false // enable_color
            );
    },

    handleInputs: function(input, paceFactor) {
        // Metrics toggle
        if(Flynn.mcp.developerModeEnabled) {
            if (input.virtualButtonWasPressed("dev_metrics")) {
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
        }
        if(Flynn.mcp.arcadeModeEnabled) {
            if (input.virtualButtonWasPressed("UI_quarter")) {
                Flynn.mcp.credits += 1;
                Game.sounds.insert_coin.play();
            }
        }


        if (  ( !Flynn.mcp.arcadeModeEnabled && input.virtualButtonWasPressed("UI_enter"))
           || (  Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0)
              && (  input.virtualButtonWasPressed("UI_start1") 
                 || input.virtualButtonWasPressed("UI_start2") )))
        {
            Flynn.mcp.credits -= 1;
            Flynn.mcp.changeState(Game.States.GAME);
            Game.sounds.start_game.play();
        }

        if (input.virtualButtonWasPressed("UI_escape")) {
            Flynn.mcp.changeState(Game.States.CONFIG);
        }
        if (input.virtualButtonWasPressed("UI_exit") && Flynn.mcp.backEnabled){
            window.history.back();
        }
    },

    update: function(paceFactor) {

        // View phase transitions
        this.timers.update(paceFactor);
        if(this.timers.hasExpired("view_phase")){
            switch(this.view_phase){
                case this.VIEW_PHASES.NORMAL:
                    this.view_phase = this.VIEW_PHASES.SCORES;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_SCORES);
                    break;
                case this.VIEW_PHASES.SCORES:
                    this.view_phase = this.VIEW_PHASES.CREDITS;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_CREDITS);
                    break;
                case this.VIEW_PHASES.CREDITS:
                    this.view_phase = this.VIEW_PHASES.NORMAL;
                    this.timers.set("view_phase", this.VIEW_PHASE_TICKS_NORMAL);
                    break;
            }
        }

        // Update swirling elements
        this.vortex.update(paceFactor);
        this.titleAngle += this.TITLE_ANGULAR_VELOCITY * paceFactor;
        this.creditsAngle += this.CREDITS_ANGULAR_VELOCITY * paceFactor;
        this.creditsAngle3 += this.CREDITS_ANGULAR_VELOCITY3 * paceFactor;
        this.creditsAngle4 += this.CREDITS_ANGULAR_VELOCITY4 * paceFactor;
        this.creditsAngle5 += this.CREDITS_ANGULAR_VELOCITY5 * paceFactor;

        this.va_logo.update(paceFactor);
    },

    render: function(ctx) {
        ctx.clearAll();
        this.vortex.render(ctx);

        var i, len, leader;
        var title_x = 160;
        var title_y = 150;
        var title_step = 5;
        var is_world = false; // Use screen coordinates
        var scale = 8;
        var credit_text, y_step, y_text, line_text, line_color;

        for (var angle = 0; angle < Math.PI + 0.1; angle += Math.PI) {
            ctx.vectorTextArc("ROUNDABOUT", scale, this.vortex.center.x, this.vortex.center.y, this.titleAngle + angle, 300, 
                Flynn.Colors.MAGENTA,
                is_world,
                false, // is_centered
                false, // is_reversed
                Flynn.Font.Block);
            ctx.vectorTextArc("ROUNDABOUT", scale, this.vortex.center.x, this.vortex.center.y, this.titleAngle - 0.01 + angle, 297,
                Flynn.Colors.CYAN,
                is_world,
                false, // is_centered
                false, // is_reversed
                Flynn.Font.Block);
        }

        switch(this.view_phase){
            case this.VIEW_PHASES.NORMAL:

                ctx.vectorTextArc("VERSION " + Game.VERSION,
                    2, this.vortex.center.x, this.vortex.center.y,
                    this.creditsAngle3, 100, Flynn.Colors.GREEN, this.IS_CENTERED);
                var startText;
                var controlsText1, controlsText2;
                if (Flynn.mcp.arcadeModeEnabled) {
                    startText =     "        PRESS START";
                    //              #########################################
                    controlsText1 = "LEFT BUTTON THRUST";
                    controlsText2 = "RIGHT BUTTON SHOOT";
                    Game.config.thrustPrompt = "PRESS LEFT BUTTON TO THRUST";
                    Game.config.shootPrompt = "PRESS RIGHT BUTTON TO SHOOT";
                    ctx.vectorText(Flynn.mcp.credits + " Credits", 2, 10, this.canvasHeight - 20, null, Flynn.Colors.YELLOW);
                }
                else {
                    if (!Flynn.mcp.browserSupportsTouch) {
                        startText = "PRESS ENTER TO START";
                        var thrustButtonName = Flynn.mcp.input.getVirtualButtonBoundKeyName("thrust");
                        var fireButtonName = Flynn.mcp.input.getVirtualButtonBoundKeyName("fire");
                        controlsText1 = thrustButtonName + " TO THRUST";
                        controlsText2 = fireButtonName + " TO SHOOT";
                        Game.config.thrustPrompt = "PRESS " + thrustButtonName + " TO THRUST";
                        Game.config.shootPrompt = "PRESS " + fireButtonName + " TO SHOOT";
                        ctx.vectorTextArc("PRESS ESCAPE TO CONFIGURE",
                            2, this.vortex.center.x, this.vortex.center.y,
                            this.creditsAngle5, 60, Flynn.Colors.GREEN, this.IS_CENTERED);
                    } else {
                        startText = "TAP ANYWHERE TO START";
                        //              #########################################
                        controlsText1 = "TAP LEFT TO THRUST";
                        controlsText2 = "TAP RIGHT TO SHOOT";
                        Game.config.thrustPrompt = "TAP LEFT TO THRUST";
                        Game.config.shootPrompt = "TAP RIGHT TO SHOOT";
                    }
                }
                if(!Flynn.mcp.arcadeModeEnabled || (Flynn.mcp.arcadeModeEnabled && (Flynn.mcp.credits > 0))) {
                    if (Math.floor(Flynn.mcp.clock / 40) % 2 == 1) {
                        ctx.vectorTextArc(startText,
                            2, this.vortex.center.x, this.vortex.center.y,
                            this.creditsAngle3 + Math.PI, 100, Flynn.Colors.CYAN, this.IS_CENTERED);
                    }
                }
                ctx.vectorTextArc(controlsText1,
                    2, this.vortex.center.x, this.vortex.center.y,
                    this.creditsAngle4, 80, Flynn.Colors.YELLOW, this.IS_CENTERED);
                ctx.vectorTextArc(controlsText2,
                    2, this.vortex.center.x, this.vortex.center.y,
                    this.creditsAngle4 + Math.PI, 80, Flynn.Colors.YELLOW, this.IS_CENTERED);

                ctx.vectorTextArc(
                    "CREATED BY ERIC MOYER AND TRAYTON MOYER (FLOATIN' HEAD)",
                    2, this.vortex.center.x, this.vortex.center.y, this.creditsAngle , 240, Flynn.Colors.GREEN);

                break;

            case this.VIEW_PHASES.SCORES:
                y_text = 290;
                ctx.vectorText('HIGH SCORES', 2, null, y_text, null, Flynn.Colors.CYAN);
                for (i = 0, len = Game.config.leaderboard.leaderList.length; i < len; i++) {
                    leader = Game.config.leaderboard.leaderList[i];
                    ctx.vectorText(leader.name, 2, 360, y_text+25*(i+2), 'left', Flynn.Colors.CYAN);
                    ctx.vectorText(leader.score, 2, 660, y_text+25*(i+2),'right', Flynn.Colors.CYAN);
                }
                break;

            case this.VIEW_PHASES.CREDITS:
                credit_text = [
                    'CREDITS',
                    '',
                    "CREATED BY ERIC MOYER AND TRAYTON MOYER (FLOATIN' HEAD)",
                    '',
                    '"FLYNN" ENGINE CREATED BY ERIC MOYER',
                    '',
                    'MUSIC "TOWERDEFENSETHEME" BY DST (NOSOAPRADIO.US)',
                    '',
                    'MORE GAMES AT VECTORALCHEMY.COM',
                    '',
                    'WANT TO HELP?',
                    '*WWW.PATREON.COM/VECTORALCHEMY'
                ];
                y_step = 25;
                y_text = Game.CANVAS_HEIGHT/2 - y_step*credit_text.length/2;
                for(i=0; i<credit_text.length; i++){
                    line_text = credit_text[i];
                    line_color = Flynn.Colors.CYAN;
                    if(line_text.startsWith('*')){
                        line_color = Flynn.Colors.ORANGE;
                        line_text = line_text.substring(1);
                    }
                    ctx.vectorText(line_text, 2, null, y_text + y_step*i, null, line_color);
                }

                break;
        } // end switch

        if(Flynn.mcp.backEnabled){
            ctx.vectorText('PRESS <TAB> TO EXIT GAME', 1.3, null, 750, null, Flynn.Colors.GRAY);
        }
        
        Flynn.mcp.renderLogo(ctx);
        this.va_logo.render(ctx);
    }

});

}()); // "use strict" wrapper