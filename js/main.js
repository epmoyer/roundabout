var GameCanvasHeight = 768;
var GameCanvasWidth = 1024;
var GameSpeedFactor = 0.7;

var States = {
	NO_CHANGE: 0,
	MENU:      1,
	CONFIG:    2,
	GAME:      3,
	END:       4
};

var Game = Class.extend({
	
	init: function() {
		"use strict";

		var self = this;

        this.input = new FlynnInputHandler();

		this.mcp = new FlynnMcp(GameCanvasWidth, GameCanvasHeight, this.input, States.NO_CHANGE, GameSpeedFactor);
		this.mcp.setStateBuilderFunc(
			function(state){
				switch(state){
					case States.MENU:
						return new StateMenu(self.mcp);
					case States.GAME:
						return new StateGame(self.mcp);
					case States.END:
						return new StateEnd(self.mcp);
					case States.CONFIG:
						return new FlynnStateConfig(self.mcp, FlynnColors.CYAN, FlynnColors.YELLOW, FlynnColors.GREEN, FlynnColors.MAGENTA);
				}
			}
		);
		this.mcp.nextState = States.MENU;

        // Setup inputs
		this.input.addVirtualButton('fire', FlynnKeyboardMap['z'], FlynnConfigurable);
		this.input.addVirtualButton('thrust', FlynnKeyboardMap['spacebar'], FlynnConfigurable);
		if(this.mcp.developerModeEnabled){
			this.input.addVirtualButton('dev_metrics', FlynnKeyboardMap['6'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_slow_mo', FlynnKeyboardMap['7'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_fps_20', FlynnKeyboardMap['\\'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_add_points', FlynnKeyboardMap['8'], FlynnNotConfigurable);
			this.input.addVirtualButton('dev_die', FlynnKeyboardMap['9'], FlynnNotConfigurable);
			this.input.addVirtualButton('vortex_grow', FlynnKeyboardMap['0'], FlynnNotConfigurable);
		}
		if(this.mcp.arcadeModeEnabled){
			this.input.addVirtualButton('quarter', FlynnKeyboardMap['5'], FlynnConfigurable);
			this.input.addVirtualButton('start_1', FlynnKeyboardMap['1'], FlynnConfigurable);
		}

		// Options
		this.mcp.optionManager.addOptionFromVirtualButton('fire');
		this.mcp.optionManager.addOptionFromVirtualButton('thrust');
		this.mcp.optionManager.addOption('musicEnabled', FlynnOptionType.BOOLEAN, true, true, 'MUSIC', null, null);
		this.mcp.optionManager.addOption('resetScores', FlynnOptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
			function(){self.resetScores();});

		// Reset Scores
		this.resetScores();
		
		// Set resize handler and force a resize
		this.mcp.setResizeFunc( function(width, height){
			if(self.mcp.browserSupportsTouch){
				self.input.addTouchRegion("thrust",0,0,width/2,height); // Left side of screen
				self.input.addTouchRegion("fire",width/2+1,0,width,height); // Right side of screen
				self.input.addTouchRegion("enter",0,0,width,height); // Whole screen
			}
		});
		this.mcp.resize();

		// Audio
		var song = new Howl({
			//src: ['sounds/song_roundabout.ogg', 'sounds/song_roundabout.mp3'],
			src: ['sounds/ThemeIntroRDB.ogg', 'sounds/ThemeIntroRDB.mp3'],
			loop: true,
			buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
			volume: 0.5,
		}).play();
	},

	resetScores: function(){
		this.mcp.highscores = [
			["FLOATINHEAD", 2200],
			["FIENDFODDER", 2100],
			["Dio",         2000],
			["Jotaro",      1300],
			["Joseph",      1200],
			["Jonathan",    1100],
		];
		this.mcp.custom.score = 0;
	},

	run: function() {
		// Start the game
		this.mcp.run();
	}
});