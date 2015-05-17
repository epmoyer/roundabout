//--------------------------------------------
// StateConfig class
//    Allow user to configure game options
//--------------------------------------------


var OptionSelectionMargin = 5;
var OptionTextScale = 2.0;
var OptionTextHeight = FlynnCharacterHeight * OptionTextScale;
var OptionFuncitonWidth = 190;
var OptionCenterGapWidth = FlynnCharacterWidth * 2 * OptionTextScale;
var OptionKeyPrompt = "PRESS NEW KEY";
var OptionSelectionWidth = OptionTextScale * FlynnCharacterSpacing * OptionKeyPrompt.length+1 + OptionSelectionMargin * 2;
var OptionMainTextColor = FlynnColors.CYAN;
var OptionMenuTextColor = FlynnColors.YELLOW;
var OptionSelectionBoxColor = FlynnColors.GREEN;
var OptionMenuPromptColor = FlynnColors.MAGENTA;

var StateConfig = FlynnState.extend({

	init: function(mcp){
		this._super(mcp);

		this.canvasWidth = mcp.canvas.ctx.width;
		this.canvasHeight = mcp.canvas.ctx.height;

		this.selectedLineIndex = 0;

		this.configurableVirtualButtonNames = this.mcp.input.getConfigurableVirtualButtonNames();
		this.numOptions = this.configurableVirtualButtonNames.length;

		this.keyAssignmentInProgress = false;
	},

	handleInputs: function(input) {
		if(this.keyAssignmentInProgress){
			var capturedKeyCode = input.getCapturedKeyCode();
			if (capturedKeyCode){
				if(!input.isKeyCodeAssigned(capturedKeyCode)){
					// The chosen keyCode is available.  Assign it.
					input.bindVirtualButtonToKey(this.configurableVirtualButtonNames[this.selectedLineIndex], capturedKeyCode);
					this.keyAssignmentInProgress = false;
				} else{
					var currentVirtualButtonName = this.configurableVirtualButtonNames[this.selectedLineIndex];
					currentlyAssignedKeyCode = input.getVirtualButtonBoundKeyCode(currentVirtualButtonName);
					if (currentlyAssignedKeyCode === capturedKeyCode){
						// User pressed the key which was already assigned.  Do nothing.
						this.keyAssignmentInProgress = false;
					} else{
						// The chosen keyCode is not availble. Keep waiting for a valid key.
						input.armKeyCodeCapture();
						// TODO: Prompt user that key is in use.
						console.log("that key is in use");
					}
				}
			}

			if (input.virtualButtonIsPressed("config")) {
				this.keyAssignmentInProgress = false;
			}
			return;
		}
		
		// Metrics toggle
        if(this.mcp.developerModeEnabled) {
            if (input.virtualButtonIsPressed("dev_metrics")) {
                this.mcp.canvas.showMetrics = !this.mcp.canvas.showMetrics;
            }
            
            // Slow Mo Debug toggle
            if (input.virtualButtonIsPressed("dev_slow_mo")){
                this.mcp.slowMoDebug = !this.mcp.slowMoDebug;
            }
        }
        if(this.mcp.arcadeModeEnabled) {
            if (input.virtualButtonIsPressed("quarter")) {
                this.mcp.credits += 1;
                this.insert_coin_sound.play();
            }
        }
		if (input.virtualButtonIsPressed("config")) {
			this.mcp.nextState = States.MENU;
		}
		if (input.virtualButtonIsPressed("down")) {
			++this.selectedLineIndex;
			if(this.selectedLineIndex >= this.numOptions){
				this.selectedLineIndex = 0;
			}
		}
		if (input.virtualButtonIsPressed("up")) {
			--this.selectedLineIndex;
			if(this.selectedLineIndex < 0){
				this.selectedLineIndex = this.numOptions-1;
			}
		}
		if (input.virtualButtonIsPressed("enter")) {
			input.armKeyCodeCapture();
			this.keyAssignmentInProgress = true;
		}
	},

	update: function(paceFactor) {

	},

	render: function(ctx) {
        ctx.clearAll();

        ctx.vectorText("CONFIGURATION OPTIONS", 4, null, 100, null, OptionMainTextColor);

        var line_spacing = 15;
        var line_y = 160;
        ctx.vectorText("PRESS <UP>/<DOWN> TO SELECT A CONTROL", 1.5, null, line_y, null, OptionMainTextColor);
        line_y += line_spacing;
        ctx.vectorText("PRESS <ENTER> TO EDIT THE SELECTED CONTROL", 1.5, null, line_y, null, OptionMainTextColor);
        line_y += line_spacing;
        ctx.vectorText("PRESS <ESCAPE> TO EXIT/CANCEL", 1.5, null, line_y, null, OptionMainTextColor);

        var names = this.configurableVirtualButtonNames;
        
        var menu_top_y = 250;
        var menu_center_x = this.canvasWidth/2;
        var menu_line_height = 30;

        var current_menu_line = 0;
        for (var i=0, len=names.length; i<len; i++){

			ctx.vectorText(names[i] + ":",
				2, menu_center_x - OptionCenterGapWidth/2,
				menu_top_y + menu_line_height * i,
				0, OptionMenuTextColor);

			var boundKeyName = this.mcp.input.getVirtualButtonBoundKeyName(names[i]);
			var boundKeyNameColor = OptionMenuTextColor;
			if(this.keyAssignmentInProgress && i===this.selectedLineIndex){
				boundKeyName = "PRESS NEW KEY";
				boundKeyNameColor = OptionMenuPromptColor;
			}
			ctx.vectorText(boundKeyName,
				2, menu_center_x + OptionCenterGapWidth/2,
				menu_top_y + menu_line_height * i,
				null, boundKeyNameColor);
			++current_menu_line;
        }

        // Show currently selected option
        // ctx.strokeStyle=OptionSelectionBoxColor;
        // ctx.beginPath();
		ctx.vectorRect(
			menu_center_x + OptionCenterGapWidth/2 - OptionSelectionMargin + 0.5,
			menu_top_y + menu_line_height * this.selectedLineIndex - OptionSelectionMargin + 0.5,
			OptionSelectionWidth,
			OptionTextHeight + 2*OptionSelectionMargin,
			OptionSelectionBoxColor);
		// ctx.stroke();
	}

});