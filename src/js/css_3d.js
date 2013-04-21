CSS = {
    mat4ToCSSMatrix : function(mat, dst) {
        dst.m11 = mat[0];
        dst.m12 = mat[1];
        dst.m13 = mat[2];
        dst.m14 = mat[3];
        dst.m21 = mat[4];
        dst.m22 = mat[5];
        dst.m23 = mat[6];
        dst.m24 = mat[7];
        dst.m31 = mat[8];
        dst.m32 = mat[9];
        dst.m33 = mat[10];
        dst.m34 = mat[11];
        dst.m41 = mat[12];
        dst.m42 = mat[13];
        dst.m43 = mat[14];
        dst.m44 = mat[15];
        return dst;
    },
    
    setPerspective : function(p) {
        this.style.webkitPerspective = p;
    },
    
    setOrigin : function(x, y) {
        this.style.webkitTransformOrigin = x + ' ' + y;
    },
    
    setTransform : function(matrix) {
        this.style.webkitTransformStyle = 'preserve-3d';
        if (!this.cssMatrix)
            this.cssMatrix = new WebKitCSSMatrix();
        this.style.webkitTransform = this.mat4ToCSSMatrix(matrix, this.cssMatrix);
        this.matrix = matrix;
    },
    
    setSz : function(w, h) {
        this.style.width = w + 'px';
        this.style.height = h + 'px';
    },
    
    setMinSz : function(w, h) {
        this.style.minWidth = w + 'px';
        this.style.minHeight = h + 'px';
    },
    
    setBg : function(color) {
        if (typeof color == 'string')
            this.style.background = color;
        else
            this.style.background = ColorUtils.colorToStyle(color);
    },

    setColor : function(color) {
        if (typeof color == 'string')
            this.style.color = color;
        else
            this.style.color = ColorUtils.colorToStyle(color);
    },
    
    setFont : function(font) {
        this.style.font = font;
    },
    
    setAlign : function(align) {
        this.style.textAlign = align;
    },
    
    setMargin : function(top, right, bottom, left) {
        this.style.margin = [top, right, bottom, left].join(' ');
    },
    
    setPadding : function(top, right, bottom, left) {
        this.style.padding = [top, right, bottom, left].join(' ');
    },

    update : function() {
        var m = this.matrix || mat4.identity();
        var deform = 0;
        if (this.gravity) {
            var floor = this.floorLevel || 0;
            deform = Math.max(0, this.velocity[1]+this.position[1]-floor) / 200;
            this.velocity[1] += 1.7;
            this.scale[1] = 1-deform;
            this.scale[0] = this.scale[2] = 1+deform/2;
            if (this.position[1] >= floor && this.velocity[1] > 0) {
                this.velocity[1] *= -0.6;
                if (Math.abs(this.velocity[1]) < 4) {
                    this.velocity[1] = 0;
                    this.position[1] = floor;
                    vec3.scale(this.velocity, 0.99);
                } else {
                    vec3.negate(this.rotV);
                }
            }
        }
        vec3.add(this.position, this.velocity);
        vec3.add(this.rotation, this.rotV);
        mat4.identity(m);
        mat4.translate(m, this.position);
        if (deform > 0) {
            mat4.translate(m, vec3.create(-200*deform/4, 200*deform/2, -200*deform/4));
        }
        mat4.scale(m, this.scale);
        mat4.rotateX(m, this.rotation[0]);
        mat4.rotateY(m, this.rotation[1]);
        mat4.rotateZ(m, this.rotation[2]);
        this.setTransform(m);
    }

};

D3 = function(){
    var div = DIV.apply(null, arguments);
    this.gravity = true;
    div.style.position = 'absolute';
    div.style.left = div.style.top = '0px';
    Object.extend(div, CSS);
    div.velocity = vec3.create(0,0,0);
    div.rotV = vec3.create(0,0,0);
    div.position = vec3.create(0,0,0);
    div.rotation = vec3.create(0,0,0);
    div.scale = vec3.create(1,1,1);
    return div;
};

TEX = function(bg) {
    var d = D3();
    d.style.width = d.style.height = '100%';
    d.setBg(bg);
    return d;
};

makeQuad = function(w, h, outsideBackground, insideBackground) {
    var quad = D3();
    quad.setSz(w, h);
    quad.style.left = -w/2 + 'px';
    quad.style.top = -h/2 + 'px';
    if (insideBackground == null) {
        quad.setBg(outsideBackground);
        return quad;
    }
    var outside = TEX(outsideBackground);
    var inside = TEX(insideBackground);
    outside.setTransform(mat4.translate(mat4.identity(), vec3.create(0, 0, -0.5)));
    inside.setTransform(mat4.translate(mat4.identity(), vec3.create(0, 0, 0.5)));
    quad.appendChild(outside);
    quad.appendChild(inside);
    return quad;
};

