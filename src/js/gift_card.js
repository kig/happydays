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
	var wall = E.makeQuad(800, 800, 'url(images/ground.png)');
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
		var w = E.makeQuad(315, h, '-webkit-linear-gradient(-90deg, rgba(212,244,248,0) 0%, rgba(212,244,248,1) 20%, rgba(130,168,180,1) 50%, hsl(250,12%,'+(7+l*40)+'%) 90%,#222 90.1%,#2cf 91.5%, hsl(250,12%,'+(7+l*40)+'%) 91.6%, hsl(270,13%, '+(0+l*40)+'%) 100%)');
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

var IsSlow = navigator.userAgent.match(/mobile/i);

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
	var cardWidth = 350;
	card.matrix = mat4();
	card.position = vec3(-cardWidth/2,0,-50);
	card.setSz(cardWidth,250);
	card.setBg('#fff');
	card.style.borderRadius = '5px';
	card.style.textAlign = 'center';

	var card_title = document.createElement('h1');
	card_title.id = 'card-title';

	var card_body = E(
		'div', 
		{id: 'card-body'},
		E('P', {id: 'card-body1'}),
		E('P', {id: 'card-body2'}),
		E('P', {id: 'card-body3'})
	);

	card.appendChild(card_title);
	card.appendChild(card_body);

	box.card = card;
	box.append(card);
	card.update = function() {
		//this.nextFold.updateFold();
		var m = this.matrix;
		mat4.identity(m);
		if (this.up) {
			spring(this, 0.3, vec3(-cardWidth/2, -380, -50), 1);
			vec3.scale(this.velocity, 0.8);
			vec3.add(this.position, this.velocity);
		} else {
			this.position[1] += (0 - this.position[1]) * 0.25;
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

	box.toggleOpen = function() {
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
				this.stopConfetti = true;
				this.zoomCounter = 30;
			}
		} else if (this.card.up) {
			this.card.up = false;
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

window.addEventListener('load', function(){
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
							 m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
							})(window,document,'script','//www.google-analytics.com/analytics.js','ga');
	ga('create', 'UA-40416926-1', 'poemyou.com');
	ga('send', 'pageview');

	if (new E.CSSMatrix().js) {
		showError();
		return;
	}

	var world = E.D3();
	world.setTransform(mat4());
	var boxVec = vec3(0, 0, 0);
	var resize = function() {
		var html = document.body.parentNode;
		var w = html.clientWidth;
		var h = html.clientHeight;
		world.setSz(w, h);
		world.setPerspective(h);
		world.width = w;
		world.height = h;
		var v = boxVec;
		v[1] = -h/2;
		v.angle = 0;
	};
	window.addEventListener('resize', resize, false);
	resize();
	world.update();
	E.css(world, 'transform', 'translateZ(-1000px)');
	document.body.appendChild(world);
	
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
	obj.zoomLookZ = -000;
	obj.zoomPX = 0;
	obj.zoomPY = 200;
	obj.zoomPZ = 200;

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

	var sparks = [];
	var n = 150;
	for (var i=0; i<n; i++) {
		var spark = E.makeQuad(4+Math.random()*8, 16+Math.random()*32, 'rgba(255,255,255,0.5)');
		sparks.push(spark);
		spark.matrix = mat4();
		var rd = Math.random()*900+1350;
		spark.position = vec3(0+Math.cos(Math.PI+Math.PI*1.5*i/n)*rd, 6400+Math.random()*6400, -900+Math.sin(Math.PI+Math.PI*1.5*i/n)*rd);
		spark.angle = i/n * Math.PI*2;
		spark.velocity = vec3(0, -60-Math.random()*62, 0);
		spark.ontick = function() {
			mat4.identity(this.matrix);
			mat4.translate(this.matrix, this.position);
			mat4.rotateY(this.matrix, this.angle);
			mat4.scale(this.matrix, vec3(1,8,1));
			//mat4.rotateX(this.matrix, this.angle);
			//this.angle += this.velocity[1]*0.005;
			vec3.add(this.position, this.velocity, this.position);
			if (this.position[1] < -1200) {
				this.position[1] = 4800;
				this.velocity[1] = -40-Math.random()*12;
			}
			//this.velocity[0] = 5*Math.sin(Date.now()/(20*this.velocity[1]));
			this.setTransform(this.matrix);
		};
		camera.append(spark);
	}

	var grids = [];
	for (x=-2; x<8; x++) {
		var line = E.makeQuad(4, 4, '-webkit-linear-gradient(0deg, rgba(255,255,255,'+(Math.pow((1-x/12), 2)*0.5)+'), rgba(255,255,255,0) 75%)');
		line.matrix = mat4.identity(line.matrix);
		mat4.translate(line.matrix, vec3(-1800, 1600, 450-900*x));
		mat4.rotateX(line.matrix, Math.PI/2);
		mat4.scale(line.matrix, vec3(4000,2,1));
		line.setTransform(line.matrix);
		camera.append(line);
	}
	for (y=-2; y<8; y++) {
		var line = E.makeQuad(4, 4, '-webkit-linear-gradient(90deg, rgba(255,255,255,'+(Math.pow((1-y/12), 2)*0.5)+'), rgba(255,255,255,0) 75%)');
		line.matrix = mat4.identity(line.matrix);
		mat4.translate(line.matrix, vec3(-2250+900*y, 1600, 0));
		mat4.rotateX(line.matrix, Math.PI/2);
		mat4.scale(line.matrix, vec3(2,4000,1));
		line.setTransform(line.matrix);
		camera.append(line);
	}

	var previousTime = 0;
	var slowFrameCounter = 0;
	var tick = function() {
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

		var r = rv;
		vec3.add(boxVec, boxes[currentBox].vector, r);
		r.angle = boxVec.angle;
		var sa = Math.sin(r.angle);
		var ca = Math.cos(r.angle);
		camera.zf += (boxes[currentBox].zoom-camera.zf) * 0.1;
		var zf = 1-camera.zf;
		r.angle += 0.01;
		
		camera.lookAt[0] += (r[0]-camera.lookAt[0] +(1-zf*zf)*obj.lookX +zf*zf*obj.zoomLookX) * 0.1;
		camera.lookAt[1] += (r[1]-camera.lookAt[1] +(1-zf)*obj.lookY +zf*obj.zoomLookY) * 0.1;
		camera.lookAt[2] += (r[2]-camera.lookAt[2] +(1-zf)*obj.lookZ +zf*obj.zoomLookZ) * 0.1;
		camera.position[0] += (r[0]-camera.position[0] +(1-zf*zf)*obj.pX +zf*zf*obj.zoomPX) * 0.15;
		camera.position[1] += (r[1]-camera.position[1] +(1-zf)*obj.pY +zf*obj.zoomPY) * 0.15;
		camera.position[2] += (r[2]-camera.position[2] +(1-zf)*obj.pZ +zf*zf*zf*zf*obj.zoomPZ) * 0.15;

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
		obj.onkeyup = obj.onchange = function() {
			E.id('card-'+name).textContent = this.value;
			updateHash();
		};
	};
	var names = 'title body1 body2 body3'.split(' ');
	names.forEach(editMon);

	var updateCards = function() {
		boxes[filledBox].querySelector('#card-title').appendChild(E.T(cardContent.t));
		boxes[filledBox].querySelector('#card-body1').appendChild(E.T(cardContent.b1));
		boxes[filledBox].querySelector('#card-body2').appendChild(E.T(cardContent.b2));
		boxes[filledBox].querySelector('#card-body3').appendChild(E.T(cardContent.b3));
	};

	var enteredSomething = false;
	window.updateHash = function() {
		if (!enteredSomething) {
			if (window.ga) ga('send', 'event', 'Edit', 'Entered_Text');
			enteredSomething = true;
		}
		cardContent.t = E.id('edit-title').value;
		cardContent.b1 = E.id('edit-body1').value;
		cardContent.b2 = E.id('edit-body2').value;
		cardContent.b3 = E.id('edit-body3').value;
		window.shareLocation = 'http://www.poemyou.com/'+('#'+btoa(E.Query.build(cardContent)));
	};

	var u = E.URL.parse();
	var query = u.query;
	var hash = E.Query.parse(u.fragment);
	if (hash.t === undefined && query.t === undefined) {
		try {
			var plain = atob(u.fragment);
			hash = E.Query.parse(plain);
		} catch(e) {}
	}

	var cardContent = {
		t: hash.t || query.t || E.id('edit-title').value,
		b1: hash.b1 || query.b1 || E.id('edit-body1').value,
		b2: hash.b2 || query.b2 || E.id('edit-body2').value,
		b3: hash.b3 || query.b3 || E.id('edit-body3').value
	};

	E.id('ready').onclick = function() {
		var t = this;
		t.disabled = true;
		hideOverlay(function() {
			t.disabled = false;
			showSend();
			showOverlay();
		});
	};
	E.id('nowai').onclick = function() {
		var t = this;
		t.disabled = true;
		hideOverlay(function() {
			t.disabled = false;
			showWrite();
			showOverlay();
		});
	};

	if (!(query.t || hash.t)) {
		if (window.ga) ga('send', 'event', 'Edit');
		updateCards();
		//showOverlay();
	} else {
		if (window.ga) ga('send', 'event', 'View');
		updateCards();
		hideOverlay();
		E.id('make-your-own').style.display = 'block';
		boxes.forEach(function(box){
			box.addEventListener('click', function() {
				setTimeout(function() {
					var e = E.id('make-your-own');
					e.style.opacity = 1;
					e.style.bottom = '20px';
				}, 4000);
			}, false);
		});
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
	var c = E.id('customize');
	E.css(c, {
		transition: '0.3s',
		opacity: 0,
		left: '0px'
	});
	setTimeout(function() {
		c.style.display = 'none';
		if (callback) {
			setTimeout(callback, 33);
		}
	}, 300);
};

var showOverlay = function(callback) {
	var c = E.id('customize');
	c.style.display = 'block';
	setTimeout(function() {
		E.css(c, {
			transition: '0.5s',
			opacity: 1,
			left: '20px'
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
	document.getElementById('write-greeting').style.display = 'none';
	document.getElementById('send-greeting').style.display = 'block';
	window.updateHash();

	var u = window.shareLocation;

	var share =E.id('share-buttons');
	share.innerHTML = (
		//'<div class="fb-like" data-send="true" data-width="450" data-show-faces="true" data-href="'+u.replace(/#/, '?')+'"></div><br>' +
			//'<div class="g-plus" data-action="share" data-height="24" data-href="'+u+'"></div><br>' + 
			//'<a href="https://twitter.com/share" class="twitter-share-button" data-url="'+u+'" data-text="Hey, I just made a box full of awesome with @PoemYouApp, go check it out">Tweet</a> ' +
			'<h4>Copy the link below:</h4>'+
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
	document.getElementById('write-greeting').style.display = 'block';
	document.getElementById('send-greeting').style.display = 'none';
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