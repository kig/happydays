(function(){
var wallVec = vec3.create(0,0,-200);

var makeWall = function(rot) {
	var wall = E.makeQuad(400, 400, 'url(images/box_wall.png)', 'url(images/box_inside_wall.png)');
	var m = mat4.identity();
	mat4.rotateY(m, rot);
	mat4.translate(m, wallVec);
	wall.setTransform(m);
	return wall;
};

var IsSlow = navigator.userAgent.match(/mobile/i);

var makeConfetti = function(room) {
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
			room.confetti.splice(room.confetti.indexOf(this), 1);
			room.removeChild(this);
		}
		this.frames++;
		E.CSS.update.call(this);
	};
	room.append(confetti);
	return confetti;
};

var springTmp = vec3.create(0,0,0);
var spring = function(object, springConstant, springPosition, mass) {
	vec3.sub(springPosition, object.position, springTmp);
	vec3.scale(springTmp, springConstant/mass);
	vec3.add(object.velocity, springTmp);
};

var makeRoom = function(x, y, z, angle, id) {
	var room = E.D3();
	room.gravity = true;
	room.position[0] = x;
	room.position[1] = y;
	room.position[2] = z;
	room.rotation[1] = angle;
	room.update();
	room.angle = angle;
	
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

	room.card = card;
	room.append(card);
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

	var floor = E.makeQuad(400, 400, 'url(images/box_bottom.png)', 'url(images/box_inside_bottom.png)');
	floor.setTransform(mat4.translate(mat4.rotateX(mat4.identity(), Math.PI/2), vec3(0,0,-200)));

	var ceil = E.makeQuad(400, 400, 'url(images/box_inside_top.png)', 'url(images/box_top.png)');
	ceil.setTransform(mat4.translate(mat4.rotateX(mat4.identity(), Math.PI/2), vec3(0, 0, 200)));
	room.append(
		floor,
		makeWall(0),
		makeWall(Math.PI*0.5),
		makeWall(Math.PI),
		makeWall(Math.PI*1.5),
		ceil
	);

	room.confetti = [];
	room.confettiTicker = 0;
	room.shootConfetti = function() {
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
	
	room.door = room.childNodes[room.childNodes.length-1];
	room.door.open = false;
	room.door.baseTransform = mat4(room.door.matrix);
	room.door.currentAngle = 0;
	room.door.targetAngle = 0;
	room.lit = false;

	room.door.angleV = 0;
	room.door.angleA = 0;

	room.toggleOpen = function() {
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
	room.lightUp = function() {
		if (this.lit) return;
		this.lit = true;
	};
	room.lightDown = function() {
		if (!this.lit) return;
		this.lit = !true;
	};
	room.zoom = 1;
	room.zoomCounter = 30;
	room.confettiCounter = 0;
	room.ontick = function() {
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
	room.doorVec = vec3(0, -200, 0);
	room.doorVec2 = vec3(0, 200, 0);
	
	room.style.cursor = 'pointer';
	room.addEventListener('click', function() {
		this.toggleOpen();
	}, false);
	return room;
};

window.addEventListener('load', function(){
	if (new E.CSSMatrix().js) {
		showError();
		return;
	}

	var world = E.D3();
	world.setTransform(mat4());
	var roomVec = vec3(0, 0, 0);
	var resize = function() {
		var html = document.body.parentNode;
		var w = html.clientWidth;
		var h = html.clientHeight;
		world.setSz(w, h);
		world.setPerspective(h);
		var v = roomVec;
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
	world.append(camera);

	var d = E.D3();
	d.setBg('red');
	d.setSz(10, 10);
	d.position = vec3(-5, -5, 0);
	//camera.append(d);
	
	var id = 0;
	var roomObject = makeRoom(0, -1600, 0, 0, id);

	camera.append(roomObject);

	var currentRoomNumber = 0;
	var zoomIn = true;
	var handleInput = function(action){
		if (action == 'click') {
			roomObject.toggleOpen();
		}
	};

	camera.zf = 1;

	var r = roomVec;

	camera.lookAt[0] = r[0];
	camera.lookAt[1] = r[1];
	camera.lookAt[2] = r[2];
	camera.position[0] = r[0];
	camera.position[1] = r[1]-300;
	camera.position[2] = r[2]+800;

	var previousTime = 0;
	var slowFrameCounter = 0;
	var tick = function() {
		var t = new Date().getTime();
		var elapsed = t - previousTime;
		previousTime = t;

		if (elapsed > 33) {
			slowFrameCounter += Math.min(2, elapsed / 33);
		} else {
			slowFrameCounter--;
		}
		if (slowFrameCounter > 5) {
			IsSlow = true;
		}

		roomObject.ontick();

		var r = roomVec;
		var sa = Math.sin(r.angle);
		var ca = Math.cos(r.angle);
		camera.zf += (roomObject.zoom-camera.zf) * 0.1;
		var zf = camera.zf;
		r.angle += 0.01;

		camera.lookAt[0] += (r[0]-camera.lookAt[0]) * 0.1;
		camera.lookAt[1] += (r[1]-camera.lookAt[1]) * 0.1;
		camera.lookAt[2] += (r[2]-camera.lookAt[2]) * 0.1;
		camera.position[0] += (r[0]-camera.position[0]+200*zf*zf) * 0.15;
		camera.position[1] += (r[1]-camera.position[1]-300*zf) * 0.15;
		camera.position[2] += (r[2]-camera.position[2]+800*zf) * 0.15;

		mat4.lookAt(
			camera.position,
			camera.lookAt,
			camera.up,
			camera.matrix
		);
		centerVec[0] = window.innerWidth/2;
		centerVec[1] = window.innerHeight/2;
		mat4.translate(camera.matrix, centerVec, camera.matrix);
		camera.setTransform(camera.matrix);
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
		E.id('card-title').appendChild(E.T(cardContent.t));
		E.id('card-body1').appendChild(E.T(cardContent.b1));
		E.id('card-body2').appendChild(E.T(cardContent.b2));
		E.id('card-body3').appendChild(E.T(cardContent.b3));
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
		window.shareLocation = 'http://www.poemyou.com/'+('#'+E.Query.build(cardContent));
	};

	var u = E.URL.parse();
	var query = u.query;
	var hash = E.Query.parse(u.fragment);

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
		if (window.ga) ga('pageview', 'Edit');
		updateCards();
		handleInput('click');
		showOverlay();
	} else {
		if (window.ga) ga('pageview', 'View');
		updateCards();
		hideOverlay();
		E.id('make-your-own').style.display = 'block';
		roomObject.addEventListener('click', function() {
			setTimeout(function() {
				var e = E.id('make-your-own');
				e.style.opacity = 1;
				e.style.bottom = '20px';
			}, 4000);
		}, false);
	}

/*
	E.requestSharedAnimationFrame(function() {
		E.requestSharedAnimationFrame(function() {
			console.log("Time to second frame: " + (Date.now() - performance.timing.navigationStart));
		});
	});
*/

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

	E.id('share-buttons').innerHTML = (
		'<div class="fb-send" data-href="'+u.replace(/#/, '?')+'"></div> ' +
			//'<a href="https://twitter.com/share" class="twitter-share-button" data-url="'+u+'" data-text="Hey, I just made a box full of awesome with @PoemYouApp, go check it out" data-count="none">Tweet</a> ' +
			'<div class="g-plus" data-action="share" data-annotation="none" data-href="'+u+'"></div> ' + 
			''
			//'<wb:share-button class="weibo-button" count="n" type="button" size="small" url="'+u+'"></wb:share-button>'
	);
	loadButtons();
	try { FB.XFBML.parse(); } catch(e) {}
	//try { WB2.initCustomTag(); } catch(e) {}
	//twttr.widgets.load();
	try { gapi.plus.go(); } catch(e) {}

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
	E.loadScript("//connect.facebook.net/en_US/all.js#xfbml=1", 'facebook-jssdk');
	//E.loadScript("//platform.twitter.com/widgets.js", 'twitter-wjs');
	E.loadScript("https://apis.google.com/js/plusone.js", 'google-plusone');
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
	/*
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
	 */
	var i;
	var option = null;
	var sum = 0, weights = [];
	for (i=0; i<options.length; i++) {
		/*
		if (options[i].name == seen.name) {
			option = options[i];
			break;
		}
		 */
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
	/*
	seen.name = option.name;
	if (window.localStorage) {
		localStorage['AB-'+name] = JSON.stringify(seen);
	}
	 */
};

ABTest("Promo", [
	{
		weight: 1,
		run: function() {}
	},

	{
		name: "Hangout Promo",
		weight: 1,
		run: function() {
			onSendCallbacks.push(function() {
				var d = E(
					'div',
					E('h3', 'Tip #1: Remember to say hello!'),
//					  E('a', {href: "http://www.google.com/+/learnmore/hangouts/", target: "_blank"}, 
//						E('img', {src: "http://www.google.com/+/images/learnmore/hangouts/feat-chat.png", width: "320", height: "194"})
//					   ),
					E('h4', 
					  "How about doing a ", 
					  E('a', {href: "http://www.google.com/+/learnmore/hangouts/", target: "_blank"}, "video call"),
					  " to follow up on your card. It's always fun to hear from you!"
					 )
				);
				d.style.opacity = 0;
				d.style.webkitTransition = d.style.MozTransition = d.style.transition = '2s';
				setTimeout(function() {
					d.style.opacity = 1;
				}, 3000);
				E.id('share-buttons').appendChild(d);
			});
		}
	},

	{
		name: "Amazon Gift Card",
		weight: 1,
		run: function() {
			onSendCallbacks.push(function() {
				var assocCode, linkCode;
				var lang = navigator.userLanguage || navigator.language || navigator.systemLanguage;
				switch (lang) {
				case 'fr-FR':
				case 'de-DE':
				case 'en-GB':
					assocCode = '<a href="http://www.amazon.co.uk/gp/product/B007L3T4MY/ref=as_li_ss_il?ie=UTF8&camp=1634&creative=19450&creativeASIN=B007L3T4MY&linkCode=as2&tag=poemyou-21"><img border="0" src="http://ws.assoc-amazon.co.uk/widgets/q?_encoding=UTF8&ASIN=B007L3T4MY&Format=_SL160_&ID=AsinImage&MarketPlace=GB&ServiceVersion=20070822&WS=1&tag=poemyou-21" ></a><img src="http://www.assoc-amazon.co.uk/e/ir?t=poemyou-21&l=as2&o=2&a=B007L3T4MY" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" />';
					linkCode = 'http://www.amazon.co.uk/gp/product/B007L3T4MY/ref=as_li_ss_il?ie=UTF8&camp=1634&creative=19450&creativeASIN=B007L3T4MY&linkCode=as2&tag=poemyou-21';
					break;
				case 'ja-JP':
				case 'en-US':
				default:
					assocCode = '<a href="http://www.amazon.com/gp/product/B004LLILM8/ref=as_li_ss_il?ie=UTF8&camp=1789&creative=390957&creativeASIN=B004LLILM8&linkCode=as2&tag=poemyou-20"><img border="0" src="http://ws.assoc-amazon.com/widgets/q?_encoding=UTF8&ASIN=B004LLILM8&Format=_SL160_&ID=AsinImage&MarketPlace=US&ServiceVersion=20070822&WS=1&tag=poemyou-20" ></a><img src="http://www.assoc-amazon.com/e/ir?t=poemyou-20&l=as2&o=1&a=B004LLILM8" width="1" height="1" border="0" alt="" style="border:none !important; margin:0px !important;" />';
					linkCode = 'http://www.amazon.com/gp/product/B004LLILM8/ref=as_li_ss_il?ie=UTF8&camp=1789&creative=390957&creativeASIN=B004LLILM8&linkCode=as2&tag=poemyou-20';
				}
				var ad = E('div');
				ad.innerHTML = assocCode;
				var d = E('div');
				d.append(
					E('h3', 'Would you also like to send a gift?'),
					ad,
					E('h4', 'Show your love with an <a href="'+linkCode+'">Amazon Gift Card</a>')
				);
				var as = d.getElementsByTagName('a');
				for (var i=0; i<as.length; i++) {
					as[i].onclick = function() {
						ga('send', 'event', 'Send', 'Gift Card Link');
					};
					as[i].target = '_blank';
				}
				d.style.opacity = 0;
				d.style.webkitTransition = d.style.MozTransition = d.style.transition = '2s';
				setTimeout(function() {
					d.style.opacity = 1;
				}, 3000);
				E.id('share-buttons').appendChild(d);
			});
		}
	}

]);


})();