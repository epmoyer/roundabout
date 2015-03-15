var FlynnTimer = Class.extend({
	init: function(timerName, initialTicks){
		this.name = timerName;
		this.tickCounter = initialTicks;
	},
});

var FlynnTimers = Class.extend({
	init: function(){
		this.timers = {};
	},

	add: function(timerName, initialTicks){
		if (timerName in this.timers){
			// Timer already exists. 
			this.timers[timerName].tickCounter =initialTicks;
		}
		else{
			// Create new timer
			newTimer = new FlynnTimer(timerName, initialTicks);
			this.timers[timerName]=newTimer;
		}
	},

	set: function(timerName, ticks){
		this.timers[timerName].tickCounter = ticks;
	},

	get: function(timerName){
		return(this.timers[timerName].tickCounter);
	},

	isExpired: function(timerName){
		return(this.timers[timerName].tickCounter <= 0);
	},

	remove: function(timerName){
		delete this.timers[timerName];
	},

	update: function(paceFactor) {
		for (var timerName in this.timers){
			var timer = this.timers[timerName];
			timer.tickCounter -= paceFactor;
			if (timer.tickCounter < 0){
				timer.tickCounter = 0;
			}
		}
	},

});