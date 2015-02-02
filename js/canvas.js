var Canvas = Class.extend({

	init: function(width, height) {
		this.showMetrics = false;
		this.canvas = document.createElement("canvas");
		this.canvas.width = width;
		this.canvas.height = height;
		this.previousTimestamp = 0;

		this.ctx = (function(ctx) {
			ctx.width = ctx.canvas.width;
			ctx.height = ctx.canvas.height;
			ctx.fps = 0;
			ctx.fpsFrameAverage = 10; // Number of frames to average over
			ctx.fpsFrameCount = 0;
			ctx.fpsMsecCount = 0;

			ctx.ACODE = "A".charCodeAt(0);
			ctx.ZEROCODE = "0".charCodeAt(0);
			ctx.SPACECODE = " ".charCodeAt(0);
			
			ctx.drawPolygon = function(p, x, y) {
				var points = p.points;

				this.strokeStyle = p.color;
				this.beginPath();
				//console.log(p.color);
				this.moveTo(points[0]+x, points[1]+y);
				for (var i=2, len=points.length; i<len; i+=2){
					this.lineTo(points[i]+x, points[i+1] +y);
				}
				
				this.stroke();
			};

			ctx.drawFpsGague = function(x, y, color, percentage){
				x += 0.5;
				y += 0.5;
				this.beginPath();
				var length = 60;
				var height = 6;
				var x_needle = percentage * length;

				ctx.fillStyle="#FFFFFF";
				ctx.rect(x,y,length,height);
				ctx.fillStyle=color;
				ctx.fillRect(x, y, x_needle, height);

				this.stroke();
			}

			ctx.vectorText = function(text, s, x, y, offset, color){
				if(typeof(color)==='undefined'){
					color = Colors.GREEN;
				};

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

				this.strokeStyle = color;
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
			
			//---------------------------
			// Calculate FPS and pacing
			//---------------------------
			/*
			self.ctx.fps = Math.round(1000/(timeStamp - self.previousTimestamp));
			// paceFactor represents the % of a 60fps frame that has elapsed.
			// At 30fps the paceFactor is 2.0,  At 15fps it is 4.0
			var paceFactor = (60*(timeStamp - self.previousTimestamp))/1000;

			/console.log(paceFactor);
			self.previousTimestamp = timeStamp;
			*/
			var timeNow = performance.now();
			//self.ctx.fps = Math.round(1000/(timeNow - self.previousTimestamp));
			self.ctx.fpsMsecCount += timeNow - self.previousTimestamp;
			// paceFactor represents the % of a 60fps frame that has elapsed.
			// At 30fps the paceFactor is 2.0,  At 15fps it is 4.0
			var paceFactor = (60*(timeNow - self.previousTimestamp))/1000;

			//console.log(paceFactor);
			++self.ctx.fpsFrameCount;
			if (self.ctx.fpsFrameCount >= self.ctx.fpsFrameAverage){
				self.ctx.fpsFrameCount = 0;
				self.ctx.fps = Math.round(1000/(self.ctx.fpsMsecCount/self.ctx.fpsFrameAverage));
				self.ctx.fpsMsecCount = 0;
			}
			self.previousTimestamp = timeNow;
			
			//---------------------------
			// Do animation
			//---------------------------
			var start = performance.now();
			animation_callback_f(paceFactor);
			var end = performance.now();
			//console.log(end-start);

			// Show metrics
			if (self.showMetrics){
				self.ctx.drawFpsGague(self.canvas.width-65, self.canvas.height-10, "#00FF00", self.ctx.fps/120);
				self.ctx.drawFpsGague(self.canvas.width-65, self.canvas.height-16, "#FFFF00", (end-start)/(1000/120));
			}

			// Update screen and request callback
			refresh_f(callback_f, self.canvas);

			
		};
		refresh_f(callback_f, this.canvas );
	}
});