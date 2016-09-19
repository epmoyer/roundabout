if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.StateMenu = Flynn.State.extend({

    TITLE_ANGULAR_VELOCITY: -0.01,
    CREDITS_ANGULAR_VELOCITY: -0.013,
    CREDITS_ANGULAR_VELOCITY2: -0.014,
    CREDITS_ANGULAR_VELOCITY2_B: -0.015,
    CREDITS_ANGULAR_VELOCITY3: -0.020,
    CREDITS_ANGULAR_VELOCITY4: -0.027,
    CREDITS_ANGULAR_VELOCITY5: -0.031,
    IS_CENTERED: true,

    init: function(mcp){
        this._super(mcp);

        this.canvasWidth = mcp.canvas.ctx.width;
        this.canvasHeight = mcp.canvas.ctx.height;

        this.vortex = new Game.Vortex(this.canvasWidth/2, this.canvasHeight/2);
        this.vortex.shieldActive = false;

        this.titleAngle = (Math.PI*2) * (210/360);
        this.creditsAngle = 0;
        this.creditsAngle2 = 2 * Math.PI/4;
        this.creditsAngle2B = 3 * Math.PI/4;
        this.creditsAngle3 = Math.PI/4;
        this.creditsAngle4 = Math.PI/4;
        this.creditsAngle5 = Math.PI/4;

        this.start_sound = new Howl({
            src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
            volume: 0.5
        });

        this.insert_coin_sound = new Howl({
            src: ['sounds/InsertCoin.ogg','sounds/InsertCoin.mp3'],
            volume: 0.5
        });
    },

    handleInputs: function(input, paceFactor) {
        // Metrics toggle
        if(this.mcp.developerModeEnabled) {
            if (input.virtualButtonIsPressed("dev_metrics")) {
                this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
            }
            
            // Toggle DEV pacing mode slow mo
            if (input.virtualButtonIsPressed("dev_slow_mo")){
                this.mcp.toggleDevPacingSlowMo();
            }

            // Toggle DEV pacing mode fps 20
            if (input.virtualButtonIsPressed("dev_fps_20")){
                this.mcp.toggleDevPacingFps20();
            }
        }
        if(this.mcp.arcadeModeEnabled) {
            if (input.virtualButtonIsPressed("UI_quarter")) {
                this.mcp.credits += 1;
                this.insert_coin_sound.play();
            }
        }


        if (  ( !this.mcp.arcadeModeEnabled && input.virtualButtonIsPressed("UI_enter"))
           || (  this.mcp.arcadeModeEnabled && (this.mcp.credits > 0)
              && (  input.virtualButtonIsPressed("UI_start1") 
                 || input.virtualButtonIsPressed("UI_start2") )))
        {
            this.mcp.credits -= 1;
            this.mcp.nextState = Game.States.GAME;
            this.start_sound.play();
        }

        if (input.virtualButtonIsPressed("UI_escape")) {
            this.mcp.nextState = Game.States.CONFIG;
        }
        if (input.virtualButtonIsPressed("UI_exit") && this.mcp.backEnabled){
            window.history.back();
        }
    },

    update: function(paceFactor) {
        // Update vortex
        this.vortex.update(paceFactor);
        this.titleAngle += this.TITLE_ANGULAR_VELOCITY * paceFactor;
        this.creditsAngle += this.CREDITS_ANGULAR_VELOCITY * paceFactor;
        this.creditsAngle2 += this.CREDITS_ANGULAR_VELOCITY2 * paceFactor;
        this.creditsAngle2B += this.CREDITS_ANGULAR_VELOCITY2_B * paceFactor;
        this.creditsAngle3 += this.CREDITS_ANGULAR_VELOCITY3 * paceFactor;
        this.creditsAngle4 += this.CREDITS_ANGULAR_VELOCITY4 * paceFactor;
        this.creditsAngle5 += this.CREDITS_ANGULAR_VELOCITY5 * paceFactor;
    },

    render: function(ctx) {
        ctx.clearAll();
        var title_x = 160;
        var title_y = 150;
        var title_step = 5;

        // Font Test
        //ctx.vectorText("!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
        //  2.5, 30, 30, null, Flynn.Colors.MAGENTA);
        //ctx.vectorText("Unimplemented:{|}~",
        //  2.5, 30, 55, null, Flynn.Colors.MAGENTA);

        for (var angle = 0; angle < Math.PI + 0.1; angle += Math.PI) {
            ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle + angle, 300, Flynn.Colors.MAGENTA);
            ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle - 0.01 + angle, 297, Flynn.Colors.CYAN);
        }

        ctx.vectorTextArc("VERSION 7.0",
            2, this.vortex.center_x, this.vortex.center_y,
            this.creditsAngle3, 100, Flynn.Colors.GREEN, this.IS_CENTERED);
        var startText;
        var controlsText1, controlsText2;
        if (this.mcp.arcadeModeEnabled) {
            startText =     "        PRESS START";
            //              #########################################
            controlsText1 = "LEFT BUTTON THRUST";
            controlsText2 = "RIGHT BUTTON SHOOT";
            this.mcp.custom.thrustPrompt = "PRESS LEFT BUTTON TO THRUST";
            this.mcp.custom.shootPrompt = "PRESS RIGHT BUTTON TO SHOOT";
            ctx.vectorText(this.mcp.credits + " Credits", 2, 10, this.canvasHeight - 20, null, Flynn.Colors.YELLOW);
        }
        else {
            if (!this.mcp.browserSupportsTouch) {
                startText = "PRESS ENTER TO START";
                var thrustButtonName = this.mcp.input.getVirtualButtonBoundKeyName("thrust");
                var fireButtonName = this.mcp.input.getVirtualButtonBoundKeyName("fire");
                controlsText1 = thrustButtonName + " TO THRUST";
                controlsText2 = fireButtonName + " TO SHOOT";
                this.mcp.custom.thrustPrompt = "PRESS " + thrustButtonName + " TO THRUST";
                this.mcp.custom.shootPrompt = "PRESS " + fireButtonName + " TO SHOOT";
                ctx.vectorTextArc("PRESS ESCAPE TO CONFIGURE",
                    2, this.vortex.center_x, this.vortex.center_y,
                    this.creditsAngle5, 60, Flynn.Colors.GREEN, this.IS_CENTERED);
            } else {
                startText = "TAP ANYWHERE TO START";
                //              #########################################
                controlsText1 = "TAP LEFT TO THRUST";
                controlsText2 = "TAP RIGHT TO SHOOT";
                this.mcp.custom.thrustPrompt = "TAP LEFT TO THRUST";
                this.mcp.custom.shootPrompt = "TAP RIGHT TO SHOOT";
            }
        }
        if(!this.mcp.arcadeModeEnabled || (this.mcp.arcadeModeEnabled && (this.mcp.credits > 0))) {
            if (Math.floor(this.mcp.clock / 40) % 2 == 1) {
                ctx.vectorTextArc(startText,
                    2, this.vortex.center_x, this.vortex.center_y,
                    this.creditsAngle3 + Math.PI, 100, Flynn.Colors.CYAN, this.IS_CENTERED);
            }
        }
        ctx.vectorTextArc(controlsText1,
            2, this.vortex.center_x, this.vortex.center_y,
            this.creditsAngle4, 80, Flynn.Colors.YELLOW, this.IS_CENTERED);
        ctx.vectorTextArc(controlsText2,
            2, this.vortex.center_x, this.vortex.center_y,
            this.creditsAngle4 + Math.PI, 80, Flynn.Colors.YELLOW, this.IS_CENTERED);

        ctx.vectorTextArc(
            "WRITTEN BY TRAYTON MOYER (FLOATIN' HEAD) AND ERIC MOYER (FIENDFODDER) FOR LUDAM MINI DARE 56",
            2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle , 240, Flynn.Colors.GREEN);
        ctx.vectorTextArc(
            "BASED ON THE ASTEROIDS VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG",
            2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2 , 220, Flynn.Colors.GREEN);
        if(this.mcp.backEnabled){
            ctx.vectorText('PRESS <TAB> TO EXIT GAME', 1.3, null, 750, null, Flynn.Colors.GRAY);
        }

        ctx.vectorText('FLYNN ' + this.mcp.version, 1.0, this.canvasWidth-3, this.canvasHeight-10, 0, Flynn.Colors.GRAY);

        this.vortex.draw(ctx);
    }

});