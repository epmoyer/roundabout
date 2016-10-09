if (typeof Game == "undefined") {
   var Game = {};  // Create namespace
}

Game.VERSION = '7.1';
Game.CANVAS_HEIGHT = 768;
Game.CANVAS_WIDTH = 1024;
Game.SPEED_FACTOR = 0.7;

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

        Flynn.init(
            Game.CANVAS_WIDTH,
            Game.CANVAS_HEIGHT, 
            Game.States.NO_CHANGE,
            Game.SPEED_FACTOR,
            function(state){
                switch(state){
                    case Game.States.MENU:
                        return new Game.StateMenu();
                    case Game.States.GAME:
                        return new Game.StateGame();
                    case Game.States.END:
                        return new Flynn.StateEnd(
                            Game.config.score,
                            Game.config.leaderboard,
                            Flynn.Colors.GREEN,
                            'HIGH SCORES',
                            'YOU MADE IT TO THE HIGH SCORE LIST!',
                            Game.States.MENU     // Parent state
                            );
                    case Game.States.CONFIG:
                        return new Flynn.StateConfig(
                            Flynn.Colors.CYAN,
                            Flynn.Colors.YELLOW,
                            Flynn.Colors.GREEN,
                            Flynn.Colors.MAGENTA,
                            Game.States.MENU     // Parent state
                            );
                }
            }
            );


        Flynn.mcp.changeState(Game.States.MENU);
        Game.config = {};
        Game.config.score = 0;
        Game.config.leaderboard = new Flynn.Leaderboard(
            ['name', 'score'],  // attributeList
            6,                  // maxItems
            true                // sortDescending
            );
        Game.config.leaderboard.setDefaultList(
            [
                {'name': 'FLOATINHEAD', 'score': 2200},
                {'name': 'FIENDFODDER', 'score': 2100},
                {'name': 'DIO',         'score': 2000},
                {'name': 'JOTARO',      'score': 1300},
                {'name': 'JOSEPH',      'score': 1200},
                {'name': 'JONATHAN',    'score': 1100},
            ]);
        Game.config.leaderboard.loadFromCookies();
        Game.config.leaderboard.saveToCookies();

        // Setup inputs
        var input = Flynn.mcp.input;
        if(!Flynn.mcp.iCadeModeEnabled){
            input.addVirtualButton('fire',   Flynn.KeyboardMap.z,        Flynn.BUTTON_CONFIGURABLE);
            input.addVirtualButton('thrust', Flynn.KeyboardMap.spacebar, Flynn.BUTTON_CONFIGURABLE);
        }
        else{
            input.addVirtualButton('thrust', Flynn.KeyboardMap.icade_t1, Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('fire',   Flynn.KeyboardMap.icade_t2, Flynn.BUTTON_NOT_CONFIGURABLE);
        }

        if(Flynn.mcp.developerModeEnabled){
            input.addVirtualButton('dev_metrics',    Flynn.KeyboardMap.num_6,     Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_slow_mo',    Flynn.KeyboardMap.num_7,     Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_fps_20',     Flynn.KeyboardMap.backslash, Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_add_points', Flynn.KeyboardMap.num_8,     Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('dev_die',        Flynn.KeyboardMap.num_9,     Flynn.BUTTON_NOT_CONFIGURABLE);
            input.addVirtualButton('vortex_grow',    Flynn.KeyboardMap.num_0,     Flynn.BUTTON_NOT_CONFIGURABLE);
        }

        // Options
        Flynn.mcp.optionManager.addOptionFromVirtualButton('fire');
        Flynn.mcp.optionManager.addOptionFromVirtualButton('thrust');
        Flynn.mcp.optionManager.addOption('musicEnabled', Flynn.OptionType.BOOLEAN, true, true, 'MUSIC', null, null);
        Flynn.mcp.optionManager.addOption('resetScores', Flynn.OptionType.COMMAND, true, true, 'RESET HIGH SCORES', null,
            function(){self.resetScores();});
        // Restore user option settings from cookies
        Flynn.mcp.optionManager.loadFromCookies();

        // Setup touch controls
        var button_size = 80;
        var x, y;
        if(Flynn.mcp.browserSupportsTouch){
            x = 0.1*button_size;
            y = Game.CANVAS_HEIGHT - 1.1*button_size;
            Flynn.mcp.input.addTouchRegion("thrust",
                x, y, x+button_size, y+button_size,
                'round',
                [Game.States.GAME]  // visible_states
                );

            x = Game.CANVAS_WIDTH - 1.1*button_size;
            Flynn.mcp.input.addTouchRegion("fire",
                x, y, x+button_size, y+button_size,
                'round',
                [Game.States.GAME]  // visible_states
                );

            Flynn.mcp.input.addTouchRegion("UI_enter",
                0, 0, Game.CANVAS_WIDTH, Game.CANVAS_HEIGHT, // Whole screen
                'rect',
                []  // visible_states (none)
                );
        }
        
        // Set resize handler and force a resize
        Flynn.mcp.setResizeFunc( function(width, height){
            // Nothing to do
        });
        Flynn.mcp.resize();

        // Audio
        var soundMusic = new Howl({
            //src: ['sounds/song_roundabout.ogg', 'sounds/song_roundabout.mp3'],
            // src: ['sounds/ThemeIntroRDB.ogg', 'sounds/ThemeIntroRDB.mp3'],
            src: ['sounds/SpaceThemev3.mp3'],
            loop: true,
            buffer: !this.browserIsIos,  // Buffering causes problems on iOS devices
            volume: 0.5,
        });
        soundMusic.play();
        soundMusic.stop();
    },

    resetScores: function(){
        Game.config.leaderboard.restoreDefaults();
    },

    run: function() {
        // Start the game
        Flynn.mcp.run();
    }
});