var Canvas = Class.extend({

	init: function(width, height) {
		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.previousTimestamp = 0;

		this.ctx = (function(ctx) {
			ctx.width = ctx.canvas.width;
			ctx.height = ctx.canvas.height;
			ctx.fps = 0;

			ctx.ACODE = "A".charCodeAt(0);
			ctx.ZEROCODE = "0".charCodeAt(0);
			ctx.SPACECODE = " ".charCodeAt(0);
			
			ctx.drawPolygon = function(p, x, y) {
				p = p.points;

				this.beginPath();
				this.moveTo(p[0]+x, p[1]+y);
				for (var i=2, len=p.length; i<len; i+=2){
					this.lineTo(p[i]+x, p[i+1] +y);
				}
				this.stroke();
			};

			ctx.drawFpsGague = function(x, y){
				x += 0.5;
				y += 0.5;
				this.beginPath();
				var length = 30;
				var height = 6;
				for(x_notch = 0; x_notch<=length; x_notch+=length/2){
					this.moveTo(x+x_notch,y);
					this.lineTo(x+x_notch,y+height/2);
				}
				this.moveTo(x,y+height/2);
				this.lineTo(x+length, y+height/2);
				x_needle = (this.fps / 120) * length;
				//console.log(x_needle);
				//x_needle = 7;
				this.moveTo(x+x_needle, y+(height/2));
				this.lineTo(x+x_needle, y+height);
				this.stroke();
			}

			ctx.vectorText = function(text, s, x, y, offset){
				text = text.toString().toUpperCase();
				var step = s*6;

				// add offset if specified
				if (typeof offset === "number") {
					x += step*(offset - text.length);
				}

				// Center x/y if they are not numbers
				if (typeof x !== "number"){
					x = Math.round((this.width - text.length*step)/2);
				}
				if (typeof y !== "number"){
					y = Math.round((this.height - step)/2);
				}

				x += 0.5;
				y += 0.5;

				for(var i = 0, len = text.length; i<len; i++){
					var ch = text.charCodeAt(i);

					if (ch === this.SPACECODE){
						x += step;
						continue;
					}
					var p;
					if(ch - this.ACODE >= 0){
						p = Points.LETTERS[ch - this.ACODE];
					} else {
						p = Points.NUMBERS[ch - this.ZEROCODE];
					}

					this.beginPath();
					this.moveTo(p[0]*s+x, p[1]*s+y);
					for (var j=2, len2=p.length; j<len2; j+=2){
						this.lineTo(p[j]*s+x, p[j+1]*s +y);
					}
					this.stroke();
					x += step;
				}
			};

			ctx.clearAll = function(){
				this.clearRect(0, 0, this.width, this.height);
			};

			return ctx;
		})(this.canvas.getContext("2d"));

		document.body.appendChild(this.canvas);
	},

	animate: function(animation_callback_f) {
		var refresh_f = (function() {
			return window.requestAnimationFrame    ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame    ||
				window.oRequestAnimationFrame      ||
				window.msRequestAnimationFrame     ||

				// probably excessive fallback
				function(cb, el){
					window.setTimeout(cb, 1000/60);
				};
		})();

		var self = this;
		var callback_f = function(timeStamp) {
			self.ctx.fps = Math.round(1000/(timeStamp - self.previousTimestamp));
			self.previousTimestamp = timeStamp;
			//console.log(this.fps);
			animation_callback_f();
			refresh_f(callback_f, self.canvas);
		};
		refresh_f(callback_f, this.canvas );
	}
});