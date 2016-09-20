if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.CANVAS_HEIGHT = 768;
Game.CANVASWIDTH = 1024;
Game.SPEEDFACTOR = 0.7;

Game.States = {
    NO_CHANGE: 0,
    MENU:      1,
    CONFIG:    2,
    GAME:      3,
    END:       4
};

Game.Main = Class.extend({
    
    init: function() {
        "use strict";

        var self = this;

        this.input = new Flynn.InputHandler();

        this.mcp = new Flynn.Mcp(Game.CANVASWIDTH, Game.CANVAS_HEIGHT, this.input, Game.States.NO_CHANGE, Game.SPEEDFACTOR);
        this.mcp.setStateBuilderFunc(
            function(state){
                switch(state){
                    case Game.States.MENU:
                        return new Game.StateMenu(self.mcp);
                    case Game.States.GAME:
                        return new Game.StateGame(self.mcp);
                    case Game.States.END:
                        return new Flynn.StateEnd(
                            self.mcp,
                            self.mcp.custom.score,
                            self.mcp.custom.leaderboard,
                            Flynn.Colors.GREEN,
                            'HIGH SCORES',
                            'YOU MADE IT TO THE HIGH SCORE LIST!',
                            Game.States.MENU     // Parent state
                            );
                    case Game.States.CONFIG:
                        return new Flynn.StateConfig(
                            self.mcp,
                            Flynn.Colors.CYAN,
                            Flynn.Colors.YELLOW,
                            Flynn.Colors.GREEN,
                            Flynn.Colors.MAGENTA,
                            Game.States.MENU     // Parent state
                            );
                }
            }
        );
        this.mcp.nextState = Game.States.MENU;
        this.mcp.custom.score = 0;
        this.mcp.custom.leaderboard = new Flynn.Leaderboard(
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
        if(!this.mcp.iCadeModeEnabled){
            this.input.addVirtualButton('fire', Flynn.KeyboardMap.z, Flynn.BUTTON_CONFIGURABLE);
            this.input.addVirtualButton('thrust', Flynn.KeyboardMap.spacebar, Flynn.BUTTON_CONFIGURABLE);
        }
        else{
            this.input.addVirtualButton('thrust', Flynn.KeyboardMap.icade_t1, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('fire', Flynn.KeyboardMap.icade_t2, Flynn.BUTTON_NOT_CONFIGURABLE);
        }
        

        if(this.mcp.developerModeEnabled){
            this.input.addVirtualButton('dev_metrics', Flynn.KeyboardMap.num_6, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_slow_mo', Flynn.KeyboardMap.num_7, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_fps_20', Flynn.KeyboardMap.backslash, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_add_points', Flynn.KeyboardMap.num_8, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('dev_die', Flynn.KeyboardMap.num_9, Flynn.BUTTON_NOT_CONFIGURABLE);
            this.input.addVirtualButton('vortex_grow', Flynn.KeyboardMap.num_0, Flynn.BUTTON_NOT_CONFIGURABLE);
        }

        // Options
        this.mcp.optionManager.addOptionFromVirtualButton('fire');
        this.mcp.optionManager.addOptionFromVirtualButton('thrust');
        this.mcp.optionManager.addOption('musicEnabled', Flynn.OptionType.BOOLEAN, true, true, 'MUSIC', null, null);
        this.mcp.optionManager.addOption('resetScores', Flynn.OptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
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