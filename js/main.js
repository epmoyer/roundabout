var States = {
	NO_CHANGE: 0,
	MENU: 1,
	GAME: 2,
	END: 3
};

var Colors = {
	BLUE:		"#2020FF",
	WHITE:		"#FFFFFF",
	GREEN:      "#00FF00",
	YELLOW:     "#FFFF00",
	RED:        "#FF0000",
	CYAN:       "#00FFFF",
	MAGENTA:	"#FF00FF",
	CYAN_DK:    "#008080",
};

var DeveloperModeEnabled = true;

var Game = Class.extend({

	init: function() {
		this.canvas = new Canvas(this, 1024, 768);

		this.input = new InputHandler({
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
		});

		this.canvas.ctx.strokeStyle = "#fff";

		this.currentState = null;
		this.stateVars = {
			score: 0
		};
		this.nextState = States.MENU;
		this.slowMoDebug = false;

		// Browser/platform support
		this.browserSupportsPerformance = true;
		try{
			var time = performance.now();
		}
		catch(err){
			this.browserSupportsPerformance = false;
		}

		this.browserIsIos = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

		if (DeveloperModeEnabled){
				console.log("DEV: broswerSupportsPeformance=", this.browserSupportsPerformance);
				console.log("DEV: broswerIsIos=", this.browserIsIos);
		}

		// Audio
		var song = new Howl({
			urls: ['sounds/song_roundabout.mp3'],
			loop: true,
			buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
		}).play();
	},

	run: function() {
		var self = this;

		this.canvas.animate( function(paceFactor) {
			if (self.nextState !== States.NO_CHANGE) {
				switch(self.nextState){
					case States.MENU:
						self.currentState = new MenuState(self);
						break;
					case States.GAME:
						self.currentState = new GameState(self);
						break;
					case States.END:
						self.currentState = new EndState(self);
						break;


				}
				self.nextState = States.NO_CHANGE;
			}

			self.currentState.handleInputs(self.input);
			if(self.slowMoDebug){
				self.currentState.update(paceFactor * 0.1); // Slow Mo
				//self.currentState.update(0); // Freeze Frame
			}
			else{
				self.currentState.update(paceFactor * 0.7);
			}
			self.currentState.render(self.canvas.ctx);
		});
	}
});