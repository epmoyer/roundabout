var Testing = Class.extend({

	init: function(a, b) {
		this.a = a;
		this.b = b
	},

	func1: function(x) {
		console.log("func 1:" + x);
	},

	func2: function(x, y){
		console.log("func 2:" + x + "," + y);
	},

	testing: function() {
		var self = this;
		var ftest = (function() {
			return null ||
			       self.func1 ;
		})();
		//ftest(7, 8, 9);
		//ftest(10, 11, 12);
	}
});