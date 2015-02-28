var GameCanvasHeight = 1024;
var GameCanvasWidth = 768;

var States = {
	NO_CHANGE: 0,
	MENU: 1,
	GAME: 2,
	END: 3
};

var Game = Class.extend({
	
	init: function() {
		"use strict";

		var self = this;

		this.input = new FlynnInputHandler({
			left:		37,
			up:			38,
			right:		39,
			down:		40,
			spacebar:	32,
			enter:		13,
			a:			65,
			s:          83,
			d:          68,
			w:          87,
			z:          90,
			one:        49,
			two:        50,
			three:      51,
			four:       52,
			five:       53,
		});

        // Detect developer mode from URL arguments ("?develop=true").
        var developerModeEnabled = false;
        if(flynnGetUrlValue("develop")=='true'){
            developerModeEnabled = true;
        }

		this.mcp = new FlynnMcp(GameCanvasHeight, GameCanvasWidth, this.input, States.NO_CHANGE, developerModeEnabled);
		this.mcp.setStateBuilderFunc(
			function(state){
				switch(state){
					case States.MENU:
						return new MenuState(self.mcp);
					case States.GAME:
						return new GameState(self.mcp);
					case States.END:
						return new EndState(self.mcp);
				}
			}
		);
		this.mcp.nextState = States.MENU;

		// Scores
		this.mcp.highscores = [
			["Dio", 2000],
			["Jotaro", 1300],
			["Joseph", 1200],
			["Jonathan", 1100],
			["FLOATINHEAD", 600],
			["FIENDFODDER", 500],
		];
		this.mcp.custom.score = 0;

		
		// Set resize handler and force a resize
		this.mcp.setResizeFunc( function(width, height){
			self.input.addTouchRegion("touchThrust",0,0,width/2,height); // Left side of screen
			self.input.addTouchRegion("touchFire",width/2+1,0,width,height); // Right side of screen
		});
		this.mcp.resize();

		// Audio
		var song = new Howl({
			src: ['sounds/song_roundabout.ogg', 'sounds/song_roundabout.mp3'],
			loop: true,
			buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
			volume: 0.75,
		}).play();
	},

	run: function() {
		// Start the game
		this.mcp.run();
	}
});