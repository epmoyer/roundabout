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

		var self = this;

		this.resize = function(){
			// Get the dimensions of the viewport
			var viewport = {
				width: window.innerWidth,
				height: window.innerHeight
			};

			// Determine game size
			var targetWidth = 1024;
			var targetHeight = 768;
			var multiplier = Math.min((viewport.height / targetHeight), (viewport.width / targetWidth));
			var actualCanvasWidth = Math.floor(targetWidth * multiplier);
			var actualCanvasHeight = Math.floor(targetHeight * multiplier);
			var top = Math.floor(viewport.height/2 - actualCanvasHeight/2);
			var left = Math.floor(viewport.width/2 - actualCanvasWidth/2);

			element = document.getElementById("gameCanvas");
			element.style.display = "block";
			element.style.width = actualCanvasWidth + "px";
			element.style.height = actualCanvasHeight + "px";
			//element.style.margin = "0px auto 0px auto";
			element.style.top = top + "px";
			element.style.left = left + "px";
			//element.style.align = "center";
			console.log(
				"new height:", actualCanvasHeight,
				"new width:", actualCanvasWidth,
				"inner Height:", viewport.height,
				"inner width", viewport.width);
			console.log("Resized.");

			// Resize game
			// element = document.getElementById("gameContainer");
			// element.style.width = newGameWidth + "px";
			// element.style.height = newGameHeight + "px";
		};

		window.addEventListener("resize", this.resize);

		this.resize();
		

		//--------------------------
		// Browser/platform support
		//--------------------------

		// SUPPORT: performance.now()
		this.browserSupportsPerformance = true;
		try{
			var time = performance.now();
		}
		catch(err){
			this.browserSupportsPerformance = false;
		}

		// SUPPORT: iOS
		this.browserIsIos = ( navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false );

		// SUPPORT: Touch
		this.browserSupportsTouch = ('ontouchstart' in document.documentElement);

		if (DeveloperModeEnabled){
				console.log("DEV: browserSupportsPeformance=", this.browserSupportsPerformance);
				console.log("DEV: browserIsIos=", this.browserIsIos);
				console.log("DEV: browserSupportsTouch=", this.browserSupportsTouch);
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