var TitleAngularVelocity = -0.01;
var CreditsAngularVelocity = -0.013;
var CreditsAngularVelocity2 = -0.014;
var CreditsAngularVelocity2B = -0.015;
var CreditsAngularVelocity3 = -0.020;
var CreditsAngularVelocity4 = -0.027;

var MenuState = FlynnState.extend({

	init: function(mcp){
		this._super(mcp);

		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;

		this.vortex = new Vortex(this.canvasWidth/2, this.canvasHeight/2);
		this.vortex.shieldActive = false;

		this.titleAngle = (Math.PI*2) * (210/360);
		this.creditsAngle = 0;
		this.creditsAngle2 = 2 * Math.PI/4;
		this.creditsAngle2B = 3 * Math.PI/4;
		this.creditsAngle3 = Math.PI/4;
		this.creditsAngle4 = Math.PI/4;

		this.start_sound = new Howl({
			src: ['sounds/Tripple_blip.ogg','sounds/Tripple_blip.mp3'],
			volume: 0.5
		});
	},

	handleInputs: function(input) {
		// Metrics toggle
        if(this.mcp.developerModeEnabled) {
            if (input.isPressed("six")) {
                this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
            }
        }
        if(this.mcp.arcadeModeEnabled) {
            if (input.isPressed("five")) {
                this.mcp.credits += 1;
            }
        }

		if (  ( input.isPressed("spacebar") && !this.mcp.arcadeModeEnabled)
           || ( input.isPressed("one")      &&  this.mcp.arcadeModeEnabled && this.mcp.credits > 0)
           || input.isPressed("touchThrust")
           || input.isPressed("touchFire"))
        {
            this.mcp.credits -= 1;
			this.mcp.nextState = States.GAME;
			this.start_sound.play();
		}
	},

	update: function(paceFactor) {
		// Update vortex
		this.vortex.update(paceFactor);
		this.titleAngle += TitleAngularVelocity * paceFactor;
		this.creditsAngle += CreditsAngularVelocity * paceFactor;
		this.creditsAngle2 += CreditsAngularVelocity2 * paceFactor;
		this.creditsAngle2B += CreditsAngularVelocity2B * paceFactor;
		this.creditsAngle3 += CreditsAngularVelocity3 * paceFactor;
		this.creditsAngle4 += CreditsAngularVelocity4 * paceFactor;
	},

	render: function(ctx) {
        ctx.clearAll();
        var title_x = 160;
        var title_y = 150;
        var title_step = 5;

        // Font Test
        //ctx.vectorText("!\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`",
        //	2.5, 30, 30, null, FlynnColors.MAGENTA);
        //ctx.vectorText("Unimplemented:{|}~",
        //	2.5, 30, 55, null, FlynnColors.MAGENTA);

        for (var angle = 0; angle < Math.PI + 0.1; angle += Math.PI) {
            ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle + angle, 300, FlynnColors.MAGENTA);
            ctx.vectorTextArc("ROUNDABOUT", 12, this.vortex.center_x, this.vortex.center_y, this.titleAngle - 0.01 + angle, 297, FlynnColors.CYAN);
        }

        ctx.vectorTextArc("VERSION 6.0",
            2, this.vortex.center_x, this.vortex.center_y,
            this.creditsAngle3, 100, FlynnColors.GREEN);
        var startText;
        var controlsText;
        if (this.mcp.arcadeModeEnabled) {
            startText =     "        PRESS START";
            //              #########################################
            controlsText = "LEFT/RIGHT BUTTON TO THRUST/SHOOT";
            this.mcp.custom.thrustPrompt = "PRESS LEFT BUTTON TO THRUST";
            this.mcp.custom.shootPrompt = "PRESS RIGHT BUTTON TO SHOOT";
            ctx.vectorText(this.mcp.credits + " Credits", 2, 10, this.canvasHeight - 20, null, FlynnColors.YELLOW);
        }
        else {
            if (!this.mcp.browserSupportsTouch) {
                startText = "PUSH SPACE TO START";
                controlsText = "Z TO THRUST        SPACE TO SHOOT";
                this.mcp.custom.thrustPrompt = "PRESS Z TO THRUST";
                this.mcp.custom.shootPrompt = "PRESS SPACE TO SHOOT";
            } else {
                startText = "TAP ANYWHERE TO START";
                //              #########################################
                controlsText = "TAP LEFT TO THRUST   TAP RIGHT TO SHOOT";
                this.mcp.custom.thrustPrompt = "TAP LEFT TO THRUST";
                this.mcp.custom.shootPrompt = "TAP RIGHT TO SHOOT";
            }
        }
        if(!this.mcp.arcadeModeEnabled || (this.mcp.arcadeModeEnabled && (this.mcp.credits > 0))) {
            if (Math.floor(this.mcp.clock / 40) % 2 == 1) {
                ctx.vectorTextArc(startText,
                    2, this.vortex.center_x, this.vortex.center_y,
                    this.creditsAngle3 + 270 * Math.PI / 360, 100, FlynnColors.CYAN);
            }
        }
		ctx.vectorTextArc(controlsText,
			2, this.vortex.center_x, this.vortex.center_y,
			this.creditsAngle4, 80, FlynnColors.YELLOW);

		ctx.vectorTextArc(
			"WRITTEN BY TRAYTON MOYER (FLOATIN' HEAD) AND ERIC MOYER (FIENDFODDER) FOR LUDAM MINI DARE 56",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle , 240, FlynnColors.GREEN);
		ctx.vectorTextArc(
			"BASED ON THE ASTEROIDS VECTOR FRAMEWORK DEVELOPED BY MAX WIHLBORG",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2 , 220, FlynnColors.GREEN);
		ctx.vectorTextArc(
			"MUSIC ROUNDABOUT 8 BIT BY STUDIO MEGAANE",
			2, this.vortex.center_x, this.vortex.center_y, this.creditsAngle2B , 200, FlynnColors.GREEN);

		this.vortex.draw(ctx);
	}

});