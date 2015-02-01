var States = {
	NO_CHANGE: 0,
	MENU: 1,
	GAME: 2,
	END: 3
}

var Game = Class.extend({

	init: function() {
		this.canvas = new Canvas(640, 480);

		this.input = new InputHandler({
			left: 		37,
			up: 		38,
			right: 		39,
			down: 		40,
			spacebar: 	32,
			enter:      13, 
			a:          65,
			s:          83,
			d:          68,
			w:          87,
			one:        49,
		})

		var testing = new Testing();
		testing.testing();

		this.canvas.ctx.strokeStyle = "#fff";

		this.currentState = null;
		this.stateVars = {
			score: 0
		}
		this.nextState = States.MENU;
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
			self.currentState.update(paceFactor);
			self.currentState.render(self.canvas.ctx);
		})
	}
});