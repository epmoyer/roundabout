/**
 * EndState class, called when game is over
 */

var CursorBlinkRate = 2;

var EndState = FlynnState.extend({

	/**
	 * Constructor
	 * 
	 * @param  {Game} game manager for the state
	 */
	init: function(game) {
		this._super(game); // call super constructor

		this.nick = "";
		this.score = game.stateVars.score;
		if (game.stateVars.score > game.highscores[game.highscores.length-1][1]){
			this.hasEnteredName = false;
		} else {
			this.hasEnteredName = true;
		}


		// get and init inputfiled from DOM
		this.namefield = document.getElementById("namefield");
		this.namefield.value = this.nick;
		this.namefield.focus();
		this.namefield.select();
		this.cursorBlinkTimer = 0;
	},

	/**
	 * @override State.handleInputs
	 *
	 * @param  {InputHandeler} input keeps track of all pressed keys
	 */
	handleInputs: function(input) {
		if (this.hasEnteredName) {
			if (input.isPressed("spacebar")) {
				// change the game state
				this.game.nextState = States.MENU;
			}
		} else {
			if (input.isPressed("enter")) {
				// take sate to next stage
				this.hasEnteredName = true;
				this.namefield.blur();

				// cleanup and append score to hiscore array
				this.nick = this.nick.replace(/[^a-zA-Z0-9\s]/g, "");
				this.nick = this.nick.trim();
				this.nick = this.nick.substring(0,13); // Limit name length

				this.game.updateHighScores(this.nick, this.score);
			}
		}
	},

	/**
	 * @override State.update
	 */
	update: function(paceFactor) {
		this.cursorBlinkTimer += ((CursorBlinkRate*2)/60) * paceFactor;
		if (!this.hasEnteredName) {
			this.namefield.focus(); // focus so player input is read
			// exit if same namefield not updated
			if (this.nick === this.namefield.value) {
				return;
			}
			// clean namefield value and set to nick variable
			this.namefield.value = this.namefield.value.replace(/[^a-zA-Z0-9\s]/g, "");
			this.nick = this.namefield.value;
		}
	},

	/**
	 * @override State.render
	 * 
	 * @param  {context2d} ctx augmented drawing context
	 */
	render: function(ctx) {
		ctx.clearAll();

		if (this.hasEnteredName) {
			// manually tweaked positions for, straightforward text
			// positioning
			ctx.vectorText("HALL OF FAME", 3, null, 130);
			for (var i = 0, len = this.game.highscores.length; i < len; i++) {
				var hs = this.game.highscores[i];
				ctx.vectorText(hs[0], 2, 390, 200+25*i);
				ctx.vectorText(hs[1], 2, 520, 200+25*i, 10);
			}
			ctx.vectorText("press space to continue", 1, null, 450);

		} else {

			ctx.vectorText("YOU MADE IT TO THE HALL OF FAME!", 4, null, 100);
			ctx.vectorText("TYPE YOUR NAME AND PRESS ENTER", 2, null, 180);
			if(this.cursorBlinkTimer%2 > 1){
				ctx.vectorText(" " + this.nick + "_", 3, null, 220);
			} else{
				ctx.vectorText(this.nick, 3, null, 220);
			}
			ctx.vectorText(this.score, 3, null, 300);
		}
	}
});