(function(){
	var wallVec = vec3.create(0,0,-200);

	var makeWall = function(rot) {
		var wall = E.makeQuad(400, 400, '.box-box_wall', '.box-box_inside_wall');
		var m = mat4.identity();
		mat4.rotateY(m, rot);
		mat4.translate(m, wallVec);
		mat4.scale(m, vec3(1.005, 1.005, 1.005));
		wall.setTransform(m);
		return wall;
	};

	var makeGround = function(x, z) {
		var wall = E.makeQuad(800, 800, 'url(images/ground2.png)');
		var m = mat4.identity();
		mat4.translate(m, vec3(x, 0, z));
		mat4.rotateX(m, Math.PI/2);
		mat4.translate(m, vec3(0,0,-201));
		var s = 1.0;
		mat4.scale(m, vec3(s,s,s));
		wall.setTransform(m);
		var v = vec3(0, 0, -379);
		var h = 1600;
		var u = vec3(399, 399.5, -h/2-0.5);
		for (var i=0; i<8; i++) {
			var l = ((i+3)%8)/8;
			var w;
			if (false && (z < -900 || x >= 900)) {
				w = E.makeQuad(315, h, '-webkit-linear-gradient(-90deg, rgba(212,244,248,0) 0%, rgba(212,244,248,1) 20%, rgba(130,168,180,1) 50%, hsl(250,12%,'+(7+l*40)+'%) 89.5%, hsl(250,12%,'+(7+l*40)+'%) 91.6%, hsl(270,13%, '+(0+l*40)+'%) 100%)');
			} else {
				w = E.makeQuad(315, h, '-webkit-linear-gradient(-90deg, rgba(212,244,248,0) 0%, rgba(212,244,248,1) 20%, rgba(130,168,180,1) 50%, hsl(250,12%,'+(7+l*40)+'%) 89.5%,#222 89.6%, #2cf 91.5%, hsl(250,12%,'+(7+l*40)+'%) 91.6%, hsl(270,13%, '+(0+l*40)+'%) 100%)');
			}
			w.style.boxSizing = 'border-box';
			m = mat4.identity();
			mat4.translate(m, u);
			mat4.rotateX(m, Math.PI/2);
			mat4.rotateY(m, i/8*Math.PI*2);
			mat4.translate(m, v);
			w.setTransform(m);
			wall.append(w);
		}
		return wall;
	};

	var IsSlow = true || navigator.userAgent.match(/mobile/i);

	var makeConfetti = function(box) {
		var confetti = E.D3();
		confetti.style.pointerEvents = 'none';
		confetti.setSz(64, 64);
		confetti.setBg(E.ColorUtils.colorToStyle(E.ColorUtils.hsl2rgb(Math.random()*360, 0.9, 0.75)));
		E.css(confetti, 'webkitMask', 'url(images/clover.png)');
		E.css(confetti, 'mask', 'url(images/clover.png)');
		var m = mat4.identity();
		confetti.setTransform(m);
		confetti.position = vec3.create(Math.random()*100-50, 200, Math.random()*100-150);
		confetti.rotation = vec3.create(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
		confetti.velocity = vec3(25*(Math.random()-0.5), -40-Math.random()*15, 25*(Math.random()-0.5));
		confetti.rotV = vec3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
		confetti.frames = 0;
		confetti.floorLevel = 8000;
		confetti.gravity = true;
		confetti.update = function() {
			if (this.frames > 200 || IsSlow) {
				box.confetti.splice(box.confetti.indexOf(this), 1);
				box.removeChild(this);
			}
			this.frames++;
			E.CSS.update.call(this);
		};
		box.append(confetti);
		return confetti;
	};

	var springTmp = vec3.create(0,0,0);
	var spring = function(object, springConstant, springPosition, mass) {
		vec3.sub(springPosition, object.position, springTmp);
		vec3.scale(springTmp, springConstant/mass);
		vec3.add(object.velocity, springTmp);
	};

	var makeBox = function(x, y, z, angle, id) {
		var box = E.D3();
		box.gravity = true;
		box.position[0] = x;
		box.position[1] = y;
		box.position[2] = z;
		box.rotation[1] = angle;
		box.update();
		box.angle = angle;
		
		var card = E.D3();
		var cardWidth = 400;
		card.matrix = mat4();
		card.position = vec3(-cardWidth/2,-200,-50);
		card.style.width = cardWidth + 'px';
		card.style.minHeight = 250+'px';

		var card_body = E(
			'div', 
			{className: 'card'}
		);

		card.appendChild(card_body);

		box.card = card;
		box.append(card);
		card.update = function() {
			//this.nextFold.updateFold();
			var m = this.matrix;
			mat4.identity(m);
			if (this.up) {
				spring(this, 0.3, vec3(-cardWidth/2, -500, -50), 1);
				vec3.scale(this.velocity, 0.8);
				vec3.add(this.position, this.velocity);
			} else {
				this.position[1] += (-200 - this.position[1]) * 0.25;
			}
			mat4.translate(m, this.position);
			mat4.rotateX(m, Math.PI/4+this.rotation[0]);
			this.setTransform(this.matrix);
		};

		var floor = E.makeQuad(400, 400, '.box-box_bottom', '.box-box_inside_bottom');
		floor.setTransform(mat4.scale(mat4.translate(mat4.rotateX(mat4.identity(), Math.PI/2), vec3(0,0,-200)), vec3(0.995, 0.995, 0.995)));

		var ceil = E.makeQuad(400, 400, '.box-box_inside_top', '.box-box_top');
		ceil.setTransform(mat4.translate(mat4.rotateX(mat4.identity(), Math.PI/2), vec3(0, 0, 200)));
		box.append(
			floor,
			makeWall(0),
			makeWall(Math.PI*0.5),
			makeWall(Math.PI),
			makeWall(Math.PI*1.5),
			ceil
		);

		box.confetti = [];
		box.confettiTicker = 0;
		box.shootConfetti = function() {
			if (IsSlow) {
				return;
			}
			if (this.confettiTicker > 0) {
				this.confettiTicker--;
				return;
			}
			this.confettiTicker = 1;
			if (this.confetti.length > 300) {
				return;
			}
			this.confetti.push(makeConfetti(this));
		};
		
		box.door = box.childNodes[box.childNodes.length-1];
		box.door.open = false;
		box.door.baseTransform = mat4(box.door.matrix);
		box.door.currentAngle = 0;
		box.door.targetAngle = 0;
		box.lit = false;

		box.door.angleV = 0;
		box.door.angleA = 0;

		var c = 'rgba(34,208,255';
		box.blink = E.makeQuad(400,400,'-webkit-radial-gradient(center, circle contain, '+c+',0) 0%, '+c+',0) 30%, '+c+',0.25) 44%, '+c+',0.25) 48%, '+c+',0.16) 58%, '+c+',0.6) 78%, '+c+',0.6) 87%, '+c+',0.16) 97%, '+c+',0.24) 98%, '+c+',0) 99%)');
		E.css(box.blink, 'pointerEvents', 'none');
		box.blink.frame = 101;
		var chrome = /Chrome/.test(navigator.userAgent);
		box.blink.ontick = function() {
			if (this.frame > 30) {
				this.style.opacity = 0;
			} else {
				this.matrix = mat4.identity(this.matrix);
				this.scale[0] = this.scale[1] = this.scale[2] = 2+3*Math.pow(0.5-0.5*Math.cos(Math.PI*this.frame/30),1.1);
				this.position[1] = chrome ? 200 : 340;
				mat4.translate(this.matrix, this.position);
				mat4.rotateX(this.matrix, Math.PI/2);
				mat4.scale(this.matrix, this.scale);
				this.setTransform(this.matrix);
				this.style.opacity = 1;
				if (this.frame < 5) {
					this.style.opacity = 0.5-0.5*Math.cos(this.frame/5*Math.PI);
				} else if (this.frame > 15) {
					this.style.opacity = 1-Math.pow(((this.frame-15)/15), 1);
				}
				this.frame++;
			}
		};
		box.append(box.blink);

		box.toggleOpen = function() {
			this.blink.frame = 0;
			this.door.open = !this.door.open;
			if (this.door.open) {
				this.door.angleA = 0.01;
				this.door.angleV = 0.120;
			} else {
				this.door.targetAngle = 0;
				this.door.angleA = -0.01;
				this.door.angleV = -0.120;
			}
		};
		box.lightUp = function() {
			if (this.lit) return;
			this.lit = true;
		};
		box.lightDown = function() {
			if (!this.lit) return;
			this.lit = !true;
		};
		box.zoom = 1;
		box.zoomCounter = 30;
		box.confettiCounter = 0;
		box.ontick = function() {
			this.update();
			this.blink.ontick();
			this.door.currentAngle += this.door.angleV;
			this.door.angleV += this.door.angleA;
			if (this.door.currentAngle < 0) {
				this.door.angleV *= -0.5;
				this.door.currentAngle = 0;
				if (Math.abs(this.door.angleV) <= Math.abs(4*this.door.angleA)) {
					this.door.angleV = 0;
					this.door.angleA = 0;
				}
			} else if (this.door.currentAngle > Math.PI/0.9) {
				this.door.angleV *= -0.5;
				this.door.currentAngle = Math.PI/0.9;
				if (Math.abs(this.door.angleV) <= Math.abs(4*this.door.angleA)) {
					this.door.angleV = 0;
					this.door.angleA = 0;
				}
			}
			if (this.door.currentAngle > Math.PI/2) {
				if (!this.stopConfetti) {
					this.confettiCounter++;
					this.shootConfetti();
				}
				if (!this.card.up && this.confettiCounter > 60) {
					this.card.up = true;
					this.card.classList.add('open');
					this.stopConfetti = true;
					this.zoomCounter = 30;
				}
			} else if (this.card.up) {
				this.card.up = false;
				this.card.classList.remove('open');
				this.stopConfetti = false;
				this.zoom = 1;
				this.zoomCounter = 30;
			}
			if (this.card.up && this.zoomCounter > 0) {
				this.zoomCounter--;
			}
			if (this.zoomCounter == 0) {
				this.zoom = 0.01;
			}
			this.card.update();
			this.confetti.forEach(function(c) { c.update(); });
			var t = mat4.translate(
				mat4.rotateX( 
					mat4.translate(this.door.baseTransform, this.doorVec, this.door.matrix), 
					this.door.currentAngle
				), this.doorVec2
			);
			this.door.setTransform(t);
		};
		box.doorVec = vec3(0, -200, 0);
		box.doorVec2 = vec3(0, 200, 0);
		
		box.style.cursor = 'pointer';
		box.addEventListener('click', function() {
			this.toggleOpen();
		}, false);
		return box;
	};

	var makeSparks = function(camera) {
		var sparks = [];
		var n = 100;
		for (var i=0; i<n; i++) {
			var spark = E.makeQuad(2+Math.random()*4, 16+Math.random()*32, '-webkit-linear-gradient(-90deg, rgba(255,255,255,0.5), rgba(255,255,255,0))');
			spark.style.pointerEvents = 'none';
			sparks.push(spark);
			spark.matrix = mat4();
			var rd = Math.random()*900+1350;
			spark.position = vec3(0+Math.cos(Math.PI+Math.PI*1.5*i/n)*rd, 6400+Math.random()*6400, -900+Math.sin(Math.PI+Math.PI*1.5*i/n)*rd);
			spark.angle = i/n * Math.PI*2;
			spark.velocity = vec3(0, -60-Math.random()*62, 0);
			spark.scale[1] = 16;
			spark.ontick = function() {
				mat4.identity(this.matrix);
				mat4.translate(this.matrix, this.position);
				mat4.rotateY(this.matrix, this.angle);
				//mat4.rotateX(this.matrix, this.angle);
				mat4.scale(this.matrix, this.scale);
				//this.angle += this.velocity[1]*0.005;
				vec3.add(this.position, this.velocity, this.position);
				if (this.position[1] < -1600) {
					this.position[1] = 4800;
					this.velocity[1] = -60-Math.random()*62;
				}
				//this.velocity[1] *= 0.99;
				//this.velocity[0] = 5*Math.sin(Date.now()/(20*this.velocity[1]));
				this.setTransform(this.matrix);
			};
			camera.append(spark);
		}
		return sparks;
	};

	var makeGrids = function(camera) {
		var grids = [];
		return grids;
		var line;
		for (var x=-2; x<8; x++) {
			line = E.makeQuad(4, 4, '-webkit-linear-gradient(0deg, rgba(255,255,255,'+(Math.pow((1-x/12), 2)*0.5)+'), rgba(255,255,255,0) 75%)');
			line.matrix = mat4.identity(line.matrix);
			mat4.translate(line.matrix, vec3(-1800, x==1?1600:2600, 450-900*x));
			mat4.rotateX(line.matrix, Math.PI/2);
			mat4.scale(line.matrix, vec3(4000,2,1));
			line.setTransform(line.matrix);
			grids.push(line);
			camera.append(line);
		}
		for (var y=-2; y<8; y++) {
			line = E.makeQuad(4, 4, '-webkit-linear-gradient(90deg, rgba(255,255,255,'+(Math.pow((1-y/12), 2)*0.5)+'), rgba(255,255,255,0) 75%)');
			line.matrix = mat4.identity(line.matrix);
			mat4.translate(line.matrix, vec3(-2250+900*y, y==2?1600:2600, 0));
			mat4.rotateX(line.matrix, Math.PI/2);
			mat4.scale(line.matrix, vec3(2,4000,1));
			line.setTransform(line.matrix);
			grids.push(line);
			camera.append(line);
		}
		return grids;
	};

	var makeClouds = function(camera) {
		var clouds = [];
		var cloud;
		var midAngle = (Math.PI * 0.8);
		for (var i=-16; i<16; i+=0.5) {
			if (i == -8) {
				i=8;
			}
			cloud = E.makeQuad(64, 64, '-webkit-radial-gradient(center, ellipse contain,rgba(12,24,28,0.1) 0%, rgba(212,244,248,0.3) 50%, rgba(255,255,255,0) 95%)');
			cloud.i = i;
			cloud.c = Math.random()*100;
			cloud.speed = 1;
			cloud.ontick = function() {
				if (this.c >= 100) {
					var a = Math.random()*0.1+(Math.PI * 0.8 + this.i/32 * Math.PI*1.7);
					var r = 2500+Math.cos((a+Math.random()*0.4)*10)*800;
					this.angle = a;
					this.r = r;
					this.y = 2300 + Math.random()*500;
					this.scaleX = 18+Math.random()*5;
					this.scaleY = 24+Math.random()*5;
					this.c = 0;
					cloud.speed = 0.9+Math.random()*3;
				}
				this.style.opacity = Math.pow(-Math.cos(this.c/100*Math.PI*2)*0.5+0.5, 0.5)*0.3;
				var x = Math.sin(this.angle) * this.r;
				var z = Math.cos(this.angle) * this.r;
				this.matrix = mat4.identity(this.matrix);
				this.position[0] = x;
				this.position[1] = this.y;
				this.position[2] = -900+z;
				this.scale[0] = this.scaleX;
				this.scale[1] = this.scaleY;
				mat4.translate(this.matrix, this.position);
				mat4.rotateY(this.matrix, this.angle);
				mat4.rotateX(this.matrix, Math.PI/2+0.1);
				mat4.rotateZ(this.matrix, -0.2*(this.angle>midAngle?-1:1));//Math.PI);///2);
				mat4.scale(this.matrix, this.scale);
				this.setTransform(this.matrix);
				this.scaleY *= 1.01;
				this.scaleX *= 1.005;
				this.angle += (midAngle-this.angle)*0.0015;
				//this.angle += 0.01;
				this.r *= 0.999;
				this.c+=Math.random()*this.speed;
			};
			cloud.ontick();
			clouds.push(cloud);
			camera.append(cloud);
		}
		return clouds;
	};

	window.addEventListener('load', function(){
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
			(i[r].q=i[r].q||[]).push(arguments);},i[r].l=1*new Date();a=s.createElement(o),
								 m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m);
								})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
		ga('create', 'UA-40416926-1', 'poemyou.com');
		ga('send', 'pageview');

		if (new E.CSSMatrix().js) {
			showError();
			return;
		}

		E.on(document, 'touchmove', function(ev) {ev.preventDefault();});

		var world = E.D3();
		document.body.appendChild(world);
		world.setTransform(mat4());
		world.setPerspective(1200);
		var boxVec = vec3(0, 0, 0);
		var resize = function() {
			var html = document.body.parentNode;
			var w = Math.min(window.innerWidth, html.clientWidth);
			var h = Math.min(window.innerHeight, html.clientHeight);
			world.setSz(w, h);
			var scale = Math.min(w/1600, h/1200);
			world.scale[0] = world.scale[1] = world.scale[2] = scale;
			world.position[2] = -1200;
			world.update();
			world.width = w;
			world.height = h;
			var v = boxVec;
			v[1] = -h/2;
			v.angle = 0;
		};
		window.addEventListener('resize', resize, false);
		resize();
		world.update();
		
		var camera = E.D3();
		camera.setTransform(mat4()); 
		camera.position = vec3(100, -200, 400);
		camera.lookAt = vec3(0, 0, 0);
		camera.up = vec3(0,1,0);
		camera.fov = 1;
		camera.near = 1;
		camera.far = 10000;
		world.append(camera);

		var d = E.D3();
		d.setBg('red');
		d.setSz(10, 10);
		d.position = vec3(-5, -5, 0);
		if (window.dat) {
			camera.append(d);
		}

		var boxes = [];

		var id = 0;
		var currentBox = 0;
		for (var j=-1; j<=1; j++) {
			for (var k=0; k<3; k++) {
				if (
					(k === 0 && j === -1) ||
						(k===0 && j === 1) ||
						(k===2 && j === -1) ||
						(k===2 && j === 1)
				) {
					continue;
				}
				if (k===1 && j===0) {
					currentBox = id;
				}
				var x = j*900;
				var y = -1200-((j+k)/9)*3600;
				var z = -k*900;
				var a = 0; //j+k;
				var ground = makeGround(x, z);
				ground.boxId = id;
				camera.append(ground);
				var box = makeBox(x, y, z, a, id);
				box.boxId = id;
				box.vector = vec3(x,0,z);
				E.on(box, 'click', function() {
					currentBox = this.boxId;
				});
				E.on(ground, 'click', function() {
					currentBox = this.boxId;
				});
				id++;
				boxes.push(box);
				camera.append(box);
			}
		}

		var filledBox = (Math.random()*boxes.length) | 0;

		var zoomIn = true;

		camera.zf = 1;

		var r = boxVec;

		camera.lookAt[0] = r[0];
		camera.lookAt[1] = r[1];
		camera.lookAt[2] = r[2];
		camera.position[0] = r[0];
		camera.position[1] = r[1]-300;
		camera.position[2] = r[2]+800;

		var obj = {};

		obj.lookX = 707;
		obj.lookY = 1162;
		obj.lookZ = -1179;
		obj.pX = -334;
		obj.pY = -269;
		obj.pZ = 186;

		obj.zoomLookX = 0;
		obj.zoomLookY = 300;
		obj.zoomLookZ = -400;
		obj.zoomPX = 0;
		obj.zoomPY = 200;
		obj.zoomPZ = -200;

		if (window.dat && false) {
			var gui = new dat.GUI();
			gui.add(obj, 'lookX', -3000, 3000);
			gui.add(obj, 'lookY', -3000, 3000);
			gui.add(obj, 'lookZ', -3000, 3000);
			gui.add(obj, 'pX', -3000, 3000);
			gui.add(obj, 'pY', -3000, 3000);
			gui.add(obj, 'pZ', -3000, 3000);
		}

		var rv = vec3();

		var mobile = /mobile/i.test(navigator.userAgent);
		var sparks = mobile ? [] : makeSparks(camera);
		var grids = mobile ? [] : makeGrids(camera);
		var clouds = (mobile || E.Browser === "Chrome") ? [] :makeClouds(camera);

		var previousTime = 0;
		var slowFrameCounter = 0;
		var tick = function() {
			if (document.activeElement && document.activeElement.tagName !== 'INPUT' && (window.scrollY || window.scrollX)) {
				window.scroll(0, 0);
			}
			var t = new Date().getTime();
			var elapsed = t - previousTime;
			previousTime = t;

			if (elapsed > 60) {
				slowFrameCounter += Math.min(2, elapsed / 33);
			} else {
				slowFrameCounter--;
			}
			if (slowFrameCounter > 10) {
				IsSlow = true;
			}

			for (var i=0; i<boxes.length; i++) {
				boxes[i].ontick();
			}

			for (var i=0; i<sparks.length; i++) {
				sparks[i].ontick();
			}

			for (var i=0; i<clouds.length; i++) {
				clouds[i].ontick();
			}

			var r = rv;
			vec3.add(boxVec, boxes[currentBox].vector, r);
			r.angle = boxVec.angle;
			var sa = Math.sin(r.angle);
			var ca = Math.cos(r.angle);
			camera.zf += (boxes[currentBox].zoom-camera.zf) * 0.04;
			var zf = 1-camera.zf;
			r.angle += 0.01;
			
			camera.lookAt[0] += (r[0]-camera.lookAt[0] +(1-zf)*obj.lookX +zf*obj.zoomLookX) * 0.06;
			camera.lookAt[1] += (r[1]-camera.lookAt[1] +(1-zf)*obj.lookY +zf*obj.zoomLookY) * 0.06;
			camera.lookAt[2] += (r[2]-camera.lookAt[2] +(1-zf)*obj.lookZ +zf*obj.zoomLookZ) * 0.06;
			camera.position[0] += (r[0]-camera.position[0] +(1-zf)*obj.pX +zf*obj.zoomPX) * 0.03;
			camera.position[1] += (r[1]-camera.position[1] +(1-zf)*obj.pY +zf*obj.zoomPY) * 0.03;
			camera.position[2] += (r[2]-camera.position[2] +(1-zf)*obj.pZ +zf*obj.zoomPZ) * 0.03;

			//camera.perspective = mat4.perspective(camera.fov, world.width/world.height, camera.near, camera.far, camera.perspective);
			mat4.lookAt(
				camera.position,
				camera.lookAt,
				camera.up,
				camera.matrix
			);
			centerVec[0] = window.innerWidth/2;
			centerVec[1] = window.innerHeight/2;
			mat4.translate(camera.matrix, centerVec, camera.matrix);
			camera.setTransform(camera.matrix); //mat4.multiply(camera.matrix, camera.perspective));
			E.requestSharedAnimationFrame(tick);
		};
		var centerVec = vec3(0,0,0);
		
		tick();

		var editMon = function(name) {
			var obj = E.id('edit-'+name);
			obj.onkeyup = function() {
				boxes[name-1].querySelector('.card').textContent = this.value;
				updateHash();
			};
			obj.onchange = function() {
				setCardValue(name, this.value);
				updateHash();
			};
		};
		var names = '1 2 3 4 5'.split(' ');
		names.forEach(editMon);

		var setCardValue = function(name, v) {
			var card = boxes[name-1].querySelector('.card');
			card.innerHTML = '';
			card.classList.remove('youtube');
			card.classList.remove('spotify');
			card.classList.remove('pinterest');
			card.classList.remove('vimeo');
			card.classList.remove('soundcloud');
			var yt = v.match(/^(https?:\/\/)?(www\.)?(youtu\.be\/|youtube\.com\/watch(\/|\/?(\?v=)?))([a-zA-Z0-9_-]+)/);
			var vimeo = v.match(/^(https?:\/\/)?((www\.)?vimeo\.com)\/([a-zA-Z0-9_-]+)/);
			var pinterest = v.match(/^(https?:\/\/)?((www\.)?pinterest\.com)\/pin\/([0-9]+)\/?$/);
			var soundcloud = v.match(/^(https?:\/\/)?((www\.)?soundcloud\.com)\//);
			var twitter = v.match(/^(https?:\/\/)?((www\.)?twitter\.com)\//);
			var skfbly = v.match(/^(https?:\/\/)?skfb.ly\//);
			if (yt) {
				card.innerHTML = '<iframe width="720" height="480" src="http://www.youtube.com/embed/'+encodeURIComponent(yt[6])+'?html5=1" frameborder="0" allowfullscreen></iframe>';
				card.classList.add("youtube");
			} else if (vimeo) {
				card.innerHTML = '<iframe width="720" height="480" src="http://player.vimeo.com/video/'+encodeURIComponent(vimeo[4])+'?html5=1" frameborder="0" allowfullscreen></iframe>';
				card.classList.add("vimeo");
			} else if (/^spotify:[a-z]+:[a-zA-Z0-9]+$/.test(v) || /^http:\/\/open\.spotify\.com\/[a-z]+\/[a-zA-Z0-9]+$/.test(v)) {
				var url = v.match(/\/([a-z]+)\/([a-zA-Z0-9]+)$/);
				if (url) {
					v = "spotify:"+url[1]+":"+url[2];
				}
				card.innerHTML = '<iframe src="https://embed.spotify.com/?uri='+encodeURIComponent(v)+'" width="300" height="380" frameborder="0" allowtransparency="true"></iframe>';
				card.classList.add("spotify");
			} else if (pinterest) {
				var a = E('a', {"href": v});
				a.setAttribute('data-pin-do', 'embedPin');
				card.append(a);
				card.classList.add('pinterest');
				E.loadScript('//assets.pinterest.com/js/pinit.js', 'pinterest');
			} else if (soundcloud) {
				card.append(E('iframe', {src:"https://w.soundcloud.com/player/?url="+encodeURIComponent(v), width:360, height:450, frameborder:0, border:0, allowtransparency:true}));
				card.classList.add('soundcloud');
			} else if (twitter) {
				card.append(E('blockquote', {className: 'twitter-tweet', width:350}, E('a', {href:v})));
				E.loadScript('//platform.twitter.com/widgets.js', 'twitter');
				card.classList.add('soundcloud');
			} else if (skfbly) {
				card.append(E('iframe', {src:v+"?autostart=0&transparent=0&autospin=0.2&controls=1", width:720, height:480, frameborder:0, border:0, allowtransparency:true}));
				card.classList.add('youtube');
			} else if (/^([a-z]+:)?\/\//.test(v)) {
				if (/\.(png|gif|jpe?g|webp)$/.test(v)) {
					card.append(E('img', {src: v}));
				} else if (/\.(webm|mp4)$/.test(v)) {
					card.append(E('video', {src: v}));
				} else if (/\.(mp3|m4a)$/.test(v)) {
					card.append(E('audio', {src: v}));
				} else {
					card.append(E.DIV(E('a', {href: v, target: "_blank"}, v)));
				}
			} else {
				card.append(E.DIV(E.T(v)));
			}
		};

		var updateCards = function() {
			for (var i=1; i<=5; i++) {
				setCardValue(i, cardContent[i]);
			}
		};

		var enteredSomething = false;
		window.updateHash = function() {
			if (!enteredSomething) {
				if (window.ga) ga('send', 'event', 'Edit', 'Entered_Text');
				enteredSomething = true;
			}
			for (var i=1; i<=5; i++) {
				cardContent[i] = E.id('edit-'+i).value;
			}
			window.shareLocation = 'http://www.poemyou.com/'+('#'+btoa(E.Query.build(cardContent)));
		};

		var u = E.URL.parse();
		var query = u.query;
		var hash = E.Query.parse(u.fragment);
		if (hash[1] === undefined && query[1] === undefined) {
			try {
				var plain = atob(u.fragment);
				hash = E.Query.parse(plain);
			} catch(e) {}
		}

		var cardContent = {};
		for (var i=1; i<=5; i++) {
			cardContent[i] = hash[i] || query[i] || E.id('edit-'+i).value;
		}

		E.id('ready').onclick = function() {
			showSend();
		};
		E.id('nowai').onclick = function() {
			showWrite();
		};

		if (false) {
			if (window.ga) ga('send', 'event', 'Edit');
			updateCards();
			showOverlay();
			boxes[filledBox].click();
		} else {
			if (window.ga) ga('send', 'event', 'View');
			updateCards();
			hideOverlay();
			//E.id('make-your-own').style.display = 'block';
			/*
			boxes.forEach(function(box){
				box.addEventListener('click', function() {
					setTimeout(function() {
						var e = E.id('make-your-own');
						e.style.opacity = 1;
						e.style.bottom = '20px';
					}, 4000);
				}, false);
			});
			 */
		}

		if (window.performance) {
			E.requestSharedAnimationFrame(function() {
				console.log("Time to second frame: " + (Date.now() - performance.timing.navigationStart));
			});
			console.log("Time to first frame: " + (Date.now() - performance.timing.navigationStart));
		}

		var shareConsidered = false;
		E.id('share-buttons').addEventListener('mouseover', function() {
			if (!shareConsidered) {
				shareConsidered = true;
				if (window.ga) ga('send', 'event', 'Edit', 'Share_Mouseover');
			}
		}, false);

		var inputs = E.tag('input');
		for (var i=0; i<inputs.length; i++) {
			var input = inputs[i];
			if (input.type == 'text') {
				E.on(input, 'focus', function() {
					if (this.value == this.getAttribute('value')) {
						this.value = '';
						this.onchange();
					}
				});
			}
		}
		
	}, false);

	var hideOverlay = function(callback) {
		var c = E.id('customize-container');
		E.css(c, {
			transition: '0.3s',
			opacity: 1,
			transform: 'rotateY(90deg)'
		});
		setTimeout(function() {
			c.style.display = 'none';
			if (callback) {
				setTimeout(callback, 33);
			}
		}, 300);
	};

	var showOverlay = function(callback) {
		var c = E.id('customize-container');
		c.style.display = 'block';
		setTimeout(function() {
			E.css(c, {
				transition: '0.5s',
				opacity: 1,
				transform: 'rotateY(0deg)'
			});
		}, 200);
		setTimeout(function() {
			if (callback) {
				setTimeout(callback, 33);
			}
		}, 700);
	};

	var showSend = function() {
		if (window.ga) ga('send', 'event', 'Edit', 'Show_Send');
		var c = E.id('customize');
		E.css(c, {
			transition: '0.5s',
			opacity: 1,
			transform: 'rotateY(180deg)'
		});
		E.css(E.id('send-greeting'), {opacity: 0.999});
		E.css(E.id('write-greeting'), {opacity: 0});
		//document.getElementById('write-greeting').style.display = 'none';
		//document.getElementById('send-greeting').style.display = 'block';
		window.updateHash();

		var u = window.shareLocation;

		var share =E.id('share-buttons');
		share.innerHTML = (
			//'<div class="fb-like" data-send="true" data-width="450" data-show-faces="true" data-href="'+u.replace(/#/, '?')+'"></div><br>' +
			//'<div class="g-plus" data-action="share" data-height="24" data-href="'+u+'"></div><br>' + 
			//'<a href="https://twitter.com/share" class="twitter-share-button" data-url="'+u+'" data-text="Hey, I just made a box full of awesome with @PoemYouApp, go check it out">Tweet</a> ' +
			'<h4>COPY BELOW</h4>'+
				'<input value="'+u+'" style="padding-left:10px;padding-right:10px;margin-bottom:20px;display:block;">'+
				''
			//'<wb:share-button class="weibo-button" count="n" type="button" size="small" url="'+u+'"></wb:share-button>'
		);
		E.tag('input', share)[0].onmouseup = function() {
			this.select();
		};
		loadButtons();
		//try { FB.XFBML.parse(); } catch(e) {}
		//try { WB2.initCustomTag(); } catch(e) {}
		//twttr.widgets.load();
		//try { gapi.plus.go(); } catch(e) {}

		for (var i=0; i<onSendCallbacks.length; i++) {
			onSendCallbacks[i]();
		}
	};

	var onSendCallbacks = [];

	var showWrite = function() {
		if (window.ga) ga('send', 'event', 'Edit', 'Show_Write');
		var c = E.id('customize');
		E.css(c, {
			transition: '0.5s',
			opacity: 1,
			transform: 'rotateY(0deg)'
		});
		E.css(E.id('write-greeting'), {opacity: 0.999});
		E.css(E.id('send-greeting'), {opacity: 0});
		//document.getElementById('write-greeting').style.display = 'block';
		//document.getElementById('send-greeting').style.display = 'none';
		E.id('share-buttons').innerHtml = '';
	};

	E.loadScript = function(src, id) { 
		if (E.id(id)) return;
		var js, fjs = E.tag('script')[0];
		js = E('script', {id: id, src: src});
		fjs.parentNode.insertBefore(js, fjs);
	};

	var loadButtons = function() {
		//E.loadScript("//connect.facebook.net/en_US/all.js#xfbml=1", 'facebook-jssdk');
		//E.loadScript("//platform.twitter.com/widgets.js", 'twitter-wjs');
		//E.loadScript("https://apis.google.com/js/plusone.js", 'google-plusone');
		//E.loadScript("http://tjs.sjs.sinajs.cn/open/api/js/wb.js", 'weibo-wb');
	};

	var showError = function() {
		var e = E.id('error');
		e.style.display = 'block';
		E.fadeIn(e);
		var start = function(){ 
			var animateInButton = function(id, dst, x, y, offset) {
				var btn = E.id(id);
				E.css(btn, 'transformOrigin', '50% 50%');
				E.css(btn, 'transform', 'translate('+x+'px,'+y+'px) scale(1) rotate(0deg)');
				var img = E.tag('img', btn)[0];
				setTimeout(function() {
					E.css(btn, 'transition', '0.5s');
					E.css(btn, 'transform', 'translate(0px,0px) scale(1) rotate('+dst+'deg)');
					E.css(btn, 'opacity', 1);
				}, offset);
			};
			animateInButton('chrome-button', 720, -200, 0, 300);
			animateInButton('safari-button', -720, 200, 0, 500);
		};
		var count = 2;
		var countDown = function() {
			count--;
			if (count === 0) {
				start();
			}
		};
		var img = E.id('chrome-button').getElementsByTagName('img')[0];
		img.src = img.getAttribute('data-src');
		img.onload = countDown;
		img = E.id('safari-button').getElementsByTagName('img')[0];
		img.src = img.getAttribute('data-src');
		img.onload = countDown;
	};

	var ABTest = function(name, options) {
		if (window.localStorage) {
			var seen = localStorage['AB-'+name];
			if (seen) {
				try { 
					seen = JSON.parse(seen);
					if (seen.time+86400*1000 < Date.now()) {
						seen = null;
					}
				} catch(e) {}
			}
			if (!seen) {
				seen = {
					time: Date.now(),
					name: ''
				};
			}
		}

		var i;
		var option = null;
		var sum = 0, weights = [];
		for (i=0; i<options.length; i++) {
			if (options[i].name == seen.name) {
				option = options[i];
				break;
			}
			sum += options[i].weight;
			weights.push(sum);
		}
		var r = Math.random() * sum;
		if (!option) {
			for (i=0; i<options.length; i++) {
				if (r <= weights[i]) {
					option = options[i];
					break;
				}
			}
		}
		ga('send', 'event', name, option.name);
		option.run();

		seen.name = option.name;
		if (window.localStorage) {
			localStorage['AB-'+name] = JSON.stringify(seen);
		}

	};

})();