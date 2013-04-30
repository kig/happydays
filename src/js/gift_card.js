(function(){
var wallVec = vec3.create(0,0,-200);

var makeWall = function(rot) {
    var wall = makeQuad(400, 400, 'url(images/box_wall.png)', 'url(images/box_inside_wall.png)');
    var m = mat4.identity();
    mat4.rotateY(m, rot);
    mat4.translate(m, wallVec);
    wall.setTransform(m);
    return wall;
};

var makeConfetti = function(room) {
    var confetti = D3();
    confetti.style.pointerEvents = 'none';
    confetti.setSz(64, 64);
    confetti.setBg(ColorUtils.colorToStyle(ColorUtils.hsl2rgb(Math.random()*360, 0.9, 0.75)));
    confetti.style.webkitMask = 'url(images/clover.png)';
    var m = mat4.identity();
    confetti.setTransform(m);
    confetti.position = vec3.create(Math.random()*100-50, 200, Math.random()*100-50);
    confetti.rotation = vec3.create(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
    confetti.velocity = vec3(25*(Math.random()-0.5), -40-Math.random()*15, 25*(Math.random()-0.5));
    confetti.rotV = vec3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5);
    confetti.frames = 0;
    confetti.floorLevel = 8000;
    confetti.gravity = true;
    confetti.update = function() {
        if (this.frames > 200) {
            room.confetti.splice(room.confetti.indexOf(this), 1);
            room.removeChild(this);
        }
        this.frames++;
        CSS.update.call(this);
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
    var room = D3();
    room.gravity = true;
    room.position[0] = x;
    room.position[1] = y;
    room.position[2] = z;
    room.rotation[1] = angle;
    room.update();
    room.angle = angle;
    
    var card = D3();
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

    var floor = makeQuad(400, 400, 'url(images/box_bottom.png)', 'url(images/box_inside_bottom.png)');
    floor.setTransform(mat4.translate(mat4.rotateX(mat4.identity(), Math.PI/2), vec3(0,0,-200)));

    var ceil = makeQuad(400, 400, 'url(images/box_inside_top.png)', 'url(images/box_top.png)');
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
              this.shootConfetti();
            }
            if (!this.card.up && this.confetti.length > 60) {
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
    var world = D3();
    world.setTransform(mat4());
    var roomVec = vec3(0, 0, 0);
    var resize = function() {
        world.setSz(window.innerWidth, window.innerHeight);
        world.setPerspective(window.innerHeight);
        var v = roomVec;
        v[1] = -window.innerHeight/2;
        v.angle = 0;
        v.roomObject = roomObject;
        rooms[0] = v;
    };
    window.addEventListener('resize', resize, false);
    world.setSz(window.innerWidth, window.innerHeight);
    world.setPerspective(window.innerHeight);
    world.update();
    document.body.appendChild(world);
    
    var camera = D3();
    camera.setTransform(mat4()); 
    camera.position = vec3(100, -200, 400);
    camera.lookAt = vec3(0, 0, 0);
    camera.up = vec3(0,1,0);
    world.append(camera);

    var d = D3();
    d.setBg('red');
    d.setSz(10, 10);
    d.position = vec3(-5, -5, 0);
//    camera.append(d);
    
    var id = 0;
    var rooms = [];
    var roomObject = makeRoom(0, -1600, 0, 0, id);
    var v = vec3(0, -window.innerHeight/2, 0); 
    v.angle = 0;
    v.roomObject = roomObject;
    rooms[id] = v;
    camera.append(roomObject);

    var currentRoomNumber = 0;        
    var zoomIn = true;
    var handleInput = function(action){
        if (action == 'click') {
            roomObject.toggleOpen();
        }
    };

/* 
    var stats = new Stats();

    // Align top-left
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.left = '0px';
    stats.domElement.style.top = '0px';

    document.body.appendChild( stats.domElement );
*/
    camera.zf = 1;

    var r = rooms[0];

    camera.lookAt[0] = r[0];
    camera.lookAt[1] = r[1];
    camera.lookAt[2] = r[2];
    camera.position[0] = r[0];
    camera.position[1] = r[1]-300;
    camera.position[2] = r[2]+800;

    var tick = function() {
        // stats.update();
        var t = new Date().getTime();
        for (var i=0; i<rooms.length; i++) {
            if (i == currentRoomNumber) {
                rooms[i].roomObject.lightUp();
            } else {
                rooms[i].roomObject.lightDown();
            }
            rooms[i].roomObject.ontick();
        }
        var r = rooms[currentRoomNumber];
        var sa = Math.sin(r.angle);
        var ca = Math.cos(r.angle);
        camera.zf += (r.roomObject.zoom-camera.zf) * 0.1;
        var zf = camera.zf;


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
        window.requestAnimFrame(tick);
    };
    var centerVec = vec3(0,0,0);
    
    tick();

    var editMon = function(name) {
        var obj = E.byId('edit-'+name);
        obj.onkeyup = obj.onchange = function() {
            E.byId('card-'+name).textContent = this.value;
		    updateHash();
        };
    };
    var names = 'title body1 body2 body3'.split(' ');
    names.forEach(editMon);

	var updateCards = function() {
		E.byId('card-title').appendChild(T(cardContent.t));
		E.byId('card-body1').appendChild(T(cardContent.b1));
		E.byId('card-body2').appendChild(T(cardContent.b2));
		E.byId('card-body3').appendChild(T(cardContent.b3));
	};

    var enteredSomething = false;
	window.updateHash = function() {
        if (!enteredSomething) {
            if (window.ga) ga('send', 'event', 'Edit', 'Entered_Text');
            enteredSomething = true;
        }
		cardContent.t = E.byId('edit-title').value;
		cardContent.b1 = E.byId('edit-body1').value;
		cardContent.b2 = E.byId('edit-body2').value;
		cardContent.b3 = E.byId('edit-body3').value;
		document.location.replace('#'+Query.build(cardContent));
	};

	var u = URL.parse(document.location.toString());
	var query = u.query;
	var hash = Query.parse(u.fragment);

	var cardContent = {
		t: hash.t || query.t || E.byId('edit-title').value,
		b1: hash.b1 || query.b1 || E.byId('edit-body1').value,
		b2: hash.b2 || query.b2 || E.byId('edit-body2').value,
		b3: hash.b3 || query.b3 || E.byId('edit-body3').value
	};

    E.byId('ready').onclick = showSend;
    E.byId('nowai').onclick = showWrite;

	if (!(query.t || hash.t)) {
        if (window.ga) ga('pageview', 'Edit');
		updateCards();
		handleInput('click');
		showOverlay();
	} else {
        if (window.ga) ga('pageview', 'View');
		updateCards();
		hideOverlay();
        E.byId('make-your-own').style.display = 'block';
        roomObject.addEventListener('click', function() {
            setTimeout(function() {
                var e = E.byId('make-your-own');
                e.style.opacity = 1;
                e.style.bottom = '20px';
            }, 4000);
        }, false);
	}

/*
    window.requestAnimFrame(function() {
        window.requestAnimFrame(function() {
            console.log("Time to second frame: " + (Date.now() - performance.timing.navigationStart));
        });
    });
*/

    var shareConsidered = false;
    E.byId('share-buttons').addEventListener('mouseover', function() {
        if (!shareConsidered) {
            shareConsidered = true;
            if (window.ga) ga('send', 'event', 'Edit', 'Share_Mouseover');
        }
    }, false);
    
}, false);

var hideOverlay = function() {
	E.byId('customize').style.display = 'none';
};

var showOverlay = function() {
	E.byId('customize').style.display = 'block';
};

var showSend = function() {
    if (window.ga) ga('send', 'event', 'Edit', 'Show_Send');
	document.getElementById('write-greeting').style.display = 'none';
	document.getElementById('send-greeting').style.display = 'block';
    window.updateHash();

    E.byId('share-buttons').innerHTML = (
        '<div class="fb-send" data-href=""></div> ' +
            '<a href="https://twitter.com/share" class="twitter-share-button" data-text="Hey, I just made a box full of awesome with @PoemYouApp, go check it out!" data-count="none">Tweet</a> ' +
            '<div class="g-plus" data-action="share" data-annotation="none"></div> ' +
            '<wb:share-button count="n" ></wb:share-button>'
    );
    loadButtons();
    FB.XFBML.parse();
    WB2.initCustomTag();
    twttr.widgets.load();
    gapi.plus.go();
};

var showWrite = function() {
    if (window.ga) ga('send', 'event', 'Edit', 'Show_Write');
	document.getElementById('write-greeting').style.display = 'block';
	document.getElementById('send-greeting').style.display = 'none';
    E.byId('share-buttons').innerHtml = '';
};

E.loadScript = function(src, id) { 
    if (E.byId(id)) return;
    var js, fjs = E.byTag('script')[0];
    js = E('script', {id: id, src: src});
    fjs.parentNode.insertBefore(js, fjs);
};

var loadButtons = function() {
    E.loadScript("//connect.facebook.net/en_US/all.js#xfbml=1", 'facebook-jssdk');
    E.loadScript("//platform.twitter.com/widgets.js", 'twitter-wjs');
    E.loadScript("https://apis.google.com/js/plusone.js", 'google-plusone');
    E.loadScript("http://tjs.sjs.sinajs.cn/open/api/js/wb.js", 'weibo-wb');
};

var ABTest = function() {
    var i;
    var sum = 0, weights = [];
    for (i=0; i<arguments.length; i++) {
        sum += arguments[i].weight;
        weights.push(sum);
    }
    var r = Math.random() * sum;
    for (i=0; i<arguments.length; i++) {
        if (r <= weights[i]) {
            ga('send', 'event', arguments[i].name);
            arguments[i].run();
            return;
        }
    }
};

ABTest(
    {
        name: "AdSense",
        weight: 1,
        run: function() {}
    },

    {
        name: "Amazon Ad",
        weight: 1,
        run: function() {}
    },

    {
        name: "PayPal Paywall",
        weight: 1,
        run: function() {}
    },

    {
        name: "PayPal Donate",
        weight: 1,
        run: function() {}
    }
);

ABTest(
    {
        name: "No Gift-giving",
        weight: 1,
        run: function() {}
    },

    {
        name: "Gift giving",
        weight: 1,
        run: function() {}
    }
);

})();