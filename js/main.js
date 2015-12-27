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
						return new FlynnStateEnd(
							self.mcp,
							self.mcp.custom.score,
							self.mcp.custom.leaderboard,
							FlynnColors.GREEN,
							'HIGH SCORES',
							'YOU MADE IT TO THE HIGH SCORE LIST!');
					case States.CONFIG:
						return new FlynnStateConfig(self.mcp, FlynnColors.CYAN, FlynnColors.YELLOW, FlynnColors.GREEN, FlynnColors.MAGENTA);
				}
			}
		);
		this.mcp.nextState = States.MENU;
		this.mcp.custom.score = 0;
		this.mcp.custom.leaderboard = new FlynnLeaderboard(
			this.mcp,
			['name', 'score'],  // attributeList
			6,                  // maxItems
			true                // sortDescending
			);
		this.mcp.custom.leaderboard.setDefaultList(
			[
				{'name': 'FLOATINHEAD', 'score': 2200},
				{'name': 'FIENDFODDER', 'score': 2100},
				{'name': 'DIO',         'score': 2000},
				{'name': 'JOTARO',      'score': 1300},
				{'name': 'JOSEPH',      'score': 1200},
				{'name': 'JONATHAN',    'score': 1100},
			]);
		this.mcp.custom.leaderboard.loadFromCookies();
		this.mcp.custom.leaderboard.saveToCookies();

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
		// Restore user option settings from cookies
		this.mcp.optionManager.loadFromCookies();
		
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
		var soundMusic = new Howl({
			//src: ['sounds/song_roundabout.ogg', 'sounds/song_roundabout.mp3'],
			// src: ['sounds/ThemeIntroRDB.ogg', 'sounds/ThemeIntroRDB.mp3'],
			src: ['sounds/SpaceThemev3.mp3'],
			loop: true,
			buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
			volume: 0.5,
		}).play();
	},

	resetScores: function(){
		this.mcp.custom.leaderboard.restoreDefaults();
	},

	run: function() {
		// Start the game
		this.mcp.run();
	}
});