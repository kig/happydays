if (typeof Magi == 'undefined') Magi = {};

Magi.console = {
  messages : [],
  IWantSpam : false,
  addMessage: function(msg) {
    this.messages.push(msg);
    if (this.messages.length >= 1000)
      this.messages.splice(0, this.messages.length-500);
  },
  log: function() {
    this.addMessage(arguments);
    if (window && window.console)
      window.console.log.apply(window.console, arguments);
  },
  spam: function() {
    if (this.IWantSpam)
      this.log.apply(this, arguments);
    else
      this.addMessage(arguments);
  }
}


Magi.Stats = {
  shaderBindCount : 0,
  materialUpdateCount : 0,
  uniformSetCount : 0,
  textureSetCount : 0,
  textureCreationCount : 0,
  vertexAttribPointerCount : 0,
  bindBufferCount : 0,
  drawElementsCount : 0,
  drawArraysCount : 0,
  vec2CreateCount : 0,
  vec3CreateCount : 0,
  vec4CreateCount : 0,
  mat3CreateCount : 0,
  mat4CreateCount : 0,
  quat4CreateCount : 0,
  reset : function(){
    for (var i in this) {
      if (typeof this[i] == 'number')
        this[i] = 0;
    }
  },
  print : function(elem) {
    elem.textContent =
      'Shader bind count: ' + this.shaderBindCount + '\n' +
      'Material update count: ' + this.materialUpdateCount + '\n' +
      'Uniform set count: ' + this.uniformSetCount + '\n' +
      'Texture creation count: ' + this.textureCreationCount + '\n' +
      'Texture set count: ' + this.textureSetCount + '\n' +
      'VertexAttribPointer count: ' + this.vertexAttribPointerCount + '\n' +
      'Bind buffer count: ' + this.bindBufferCount + '\n' +
      'Draw elements count: ' + this.drawElementsCount + '\n' +
      'Draw arrays count: ' + this.drawArraysCount + '\n' +
      'vec2 create count: ' + this.vec2CreateCount + '\n' +
      'vec3 create count: ' + this.vec3CreateCount + '\n' +
      'vec4 create count: ' + this.vec4CreateCount + '\n' +
      'mat3 create count: ' + this.mat3CreateCount + '\n' +
      'mat4 create count: ' + this.mat4CreateCount + '\n' +
      'quat4 create count: ' + this.quat4CreateCount + '\n' +
      '';
  }
}


window.requestAnimFrame = (function(){
                           return  window.requestAnimationFrame       || 
                           window.webkitRequestAnimationFrame || 
                           window.mozRequestAnimationFrame    || 
                           window.oRequestAnimationFrame      || 
                           window.msRequestAnimationFrame     || 
                           function(/* function */ callback, /* DOMElement */ element){
                           window.setTimeout(callback, 1000 / 60);
                           };
                           })();


if (!window['toArray']) {
  /**
    Creates a new array from an object with #length.
    */
  toArray = function(obj) {
    var a = new Array(obj.length)
    for (var i=0; i<obj.length; i++)
      a[i] = obj[i]
    return a
  }
}

/**
  Merges the src object's attributes with the dst object, ignoring errors.

  @param dst The destination object
  @param src The source object
  @return The dst object
  @addon
  */
Object.forceExtend = function(dst, src) {
  for (var i in src) {
    try{ dst[i] = src[i] } catch(e) {}
  }
  return dst
}
// In case Object.extend isn't defined already, set it to Object.forceExtend.
if (!Object.extend)
  Object.extend = Object.forceExtend

/**
  Klass is a function that returns a constructor function.

  The constructor function calls #initialize with its arguments.

  The parameters to Klass have their prototypes or themselves merged with the
  constructor function's prototype.

  Finally, the constructor function's prototype is merged with the constructor
  function. So you can write Shape.getArea.call(this) instead of
  Shape.prototype.getArea.call(this).

  Shape = Klass({
    getArea : function() {
      throw('No area defined!')
    }
  })

  Rectangle = Klass(Shape, {
    initialize : function(x, y) {
      this.x = x
      this.y = y
    },

    getArea : function() {
      return this.x * this.y
    }
  })

  Square = Klass(Rectangle, {
    initialize : function(s) {
      Rectangle.initialize.call(this, s, s)
    }
  })

  new Square(5).getArea()
  //=> 25

  @return Constructor object for the class
  */
Klass = function() {
  var c = function() {
    this.initialize.apply(this, arguments)
  }
  c.ancestors = toArray(arguments)
  c.prototype = {}
  for(var i = 0; i<arguments.length; i++) {
    var a = arguments[i]
    if (a.prototype) {
      Object.extend(c.prototype, a.prototype)
    } else {
      Object.extend(c.prototype, a)
    }
  }
  Object.extend(c, c.prototype)
  return c
}



Magi.Curves = {

  angularDistance : function(a, b) {
    var pi2 = Math.PI*2;
    var d = (b - a) % pi2;
    if (d > Math.PI) d -= pi2;
    if (d < -Math.PI) d += pi2;
    return d;
  },

  linePoint : function(a, b, t, dest) {
    if (!dest) dest = vec3.create();
    dest[0] = a[0]+(b[0]-a[0])*t
    dest[1] = a[1]+(b[1]-a[1])*t;
    dest[2] = a[2]+(b[2]-a[2])*t;
    return dest;
  },

  quadraticPoint : function(a, b, c, t, dest) {
    if (!dest) dest = vec3.create();
    // var d = this.linePoint(a,b,t)
    // var e = this.linePoint(b,c,t)
    // return this.linePoint(d,e,t)
    var dx = a[0]+(b[0]-a[0])*t;
    var ex = b[0]+(c[0]-b[0])*t;
    var x = dx+(ex-dx)*t;
    var dy = a[1]+(b[1]-a[1])*t;
    var ey = b[1]+(c[1]-b[1])*t;
    var y = dy+(ey-dy)*t;
    var dz = a[2]+(b[2]-a[2])*t;
    var ez = b[2]+(c[2]-b[2])*t;
    var z = dz+(ez-dz)*t;
    dest[0] = x; dest[1] = y; dest[2] = z;
    return dest;
  },

  cubicPoint : function(a, b, c, d, t, dest) {
    if (!dest) dest = vec3.create();
    var ax3 = a[0]*3;
    var bx3 = b[0]*3;
    var cx3 = c[0]*3;
    var ay3 = a[1]*3;
    var by3 = b[1]*3;
    var cy3 = c[1]*3;
    var az3 = a[2]*3;
    var bz3 = b[2]*3;
    var cz3 = c[2]*3;
    var x = a[0] + t*(bx3 - ax3 + t*(ax3-2*bx3+cx3 + t*(bx3-a[0]-cx3+d[0])));
    var y = a[1] + t*(by3 - ay3 + t*(ay3-2*by3+cy3 + t*(by3-a[1]-cy3+d[1])));
    var z = a[2] + t*(bz3 - az3 + t*(az3-2*bz3+cz3 + t*(bz3-a[2]-cz3+d[2])));
    dest[0] = x; dest[1] = y; dest[2] = z;
    return dest;
  },

  linearValue : function(a,b,t) {
    return a + (b-a)*t;
  },

  quadraticValue : function(a,b,c,t) {
    var d = a + (b-a)*t;
    var e = b + (c-b)*t;
    return d + (e-d)*t;
  },

  cubicValue : function(a,b,c,d,t) {
    var a3 = a*3, b3 = b*3, c3 = c*3;
    return a + t*(b3 - a3 + t*(a3-2*b3+c3 + t*(b3-a-c3+d)));
  },

  catmullRomPoint : function (a,b,c,d, t, dest) {
    if (dest == null) dest = vec3.create();
    var af = ((-t+2)*t-1)*t*0.5;
    var bf = (((3*t-5)*t)*t+2)*0.5;
    var cf = ((-3*t+4)*t+1)*t*0.5;
    var df = ((t-1)*t*t)*0.5;
    var x = a[0]*af + b[0]*bf + c[0]*cf + d[0]*df;
    var y = a[1]*af + b[1]*bf + c[1]*cf + d[1]*df;
    var z = a[2]*af + b[2]*bf + c[2]*cf + d[2]*df;
    dest[0] = x; dest[1] = y; dest[2] = z;
    return dest;
  },

  catmullRomVector : function(a,b,c,d, t, dst) {
    var dx = 0.5 * (c[0] - a[0] + 2*t*(2*a[0] - 5*b[0] + 4*c[0] - d[0]) +
             3*t*t*(3*b[0] + d[0] - a[0] - 3*c[0]));
    var dy = 0.5 * (c[1] - a[1] + 2*t*(2*a[1] - 5*b[1] + 4*c[1] - d[1]) +
             3*t*t*(3*b[1] + d[1] - a[1] - 3*c[1]));
    var dz = 0.5 * (c[2] - a[2] + 2*t*(2*a[2] - 5*b[2] + 4*c[2] - d[2]) +
             3*t*t*(3*b[2] + d[2] - a[2] - 3*c[2]));
    if (!dst) dst = vec3.create();
    dst[0] = dx; dst[1] = dy; dst[2] = dz;
    vec3.normalize(dst);
    return dst;
  },

  catmullRomPointVector : function (a,b,c,d, t, dst) {
    if (dst == null) dst = { point: vec3.create(), vector: vec3.create() };
    this.catmullRomPoint(a,b,c,d,t,dst.point);
    this.catmullRomVector(a,b,c,d,t,dst.vector);
    return dst;
  },

  lineVector : function(a,b,dst) {
    if (dst == null) dst = vec3.create();
    vec3.sub(b, a, dst);
    dst.normalize();
    return dst;
  },

  linePointVector : function(a,b,t,dst) {
    if (dst == null) dst = { point: vec3.create(), vector: vec3.create() };
    this.linePoint(a,b,t,dst.point);
    this.lineVector(a,b,dst.vector);
    return dst;
  },

  __tmp0 : vec3.create(),
  __tmp1 : vec3.create(),
  __tmp2 : vec3.create(),
  __tmp3 : vec3.create(),
  __tmp4 : vec3.create(),
  __tmp5 : vec3.create(),

  quadraticVector : function(a,b,c,t,dst) {
    if (dst == null) dst = vec3.create();
    var d = this.__tmp0, e = this.__tmp1;
    d = this.linePoint(a,b,t, d);
    e = this.linePoint(b,c,t, e);
    return this.lineVector(d,e, dst);
  },

  quadraticPointVector : function(a,b,c,t,dst) {
    if (dst == null) dst = { point: vec3.create(), vector: vec3.create() };
    this.quadraticPoint(a,b,t,dst.point);
    this.quadraticVector(a,b,t,dst.vector);
    return dst;
  },

  cubicVector : function(a, b, c, d, t, dst) {
    if (dst == null) dst = vec3.create();
    var e = this.__tmp2, f = this.__tmp3;
    e = this.quadraticPoint(a,b,c,t, e);
    f = this.quadraticPoint(b,c,d,t, f);
    return this.lineVector(e,f,dst);
  },

  cubicPointVector : function(a,b,c,d,t,dst) {
    if (dst == null) dst = { point: vec3.create(), vector: vec3.create() };
    this.cubicPoint(a,b,t,dst.point);
    this.cubicVector(a,b,t,dst.vector);
    return dst;
  },

  lineLength : function(a,b) {
    var x = (b[0]-a[0]);
    var y = (b[1]-a[1]);
    var z = (b[2]-a[2]);
    return Math.sqrt(x*x + y*y + z*z);
  },

  squareLineLength : function(a,b) {
    var x = (b[0]-a[0]);
    var y = (b[1]-a[1]);
    var z = (b[2]-a[2]);
    return x*x + y*y + z*z;
  },

  quadraticLength : function(a,b,c, error) {
    var p1 = this.__tmp4, p2 = this.__tmp5;
    p1 = this.linePoint(a,b,2/3, p1)
    p2 = this.linePoint(b,c,1/3, p2)
    return this.cubicLength(a,p1,p2,c, error)
  },

  cubicLength : (function() {
    var bezsplit = function(v) {
      var vtemp = [v.slice(0)];

      for (var i=1; i < 4; i++) {
        vtemp[i] = [[],[],[],[]];
        for (var j=0; j < 4-i; j++) {
          vtemp[i][j][0] = 0.5 * (vtemp[i-1][j][0] + vtemp[i-1][j+1][0]);
          vtemp[i][j][1] = 0.5 * (vtemp[i-1][j][1] + vtemp[i-1][j+1][1]);
        }
      }
      var left = [];
      var right = [];
      for (var j=0; j<4; j++) {
        left[j] = vtemp[j][0];
        right[j] = vtemp[3-j][j];
      }
      return [left, right];
    };

    var addifclose = function(v, error) {
      var len = 0;
      for (var i=0; i < 3; i++) {
        len += Curves.lineLength(v[i], v[i+1]);
      }
      var chord = Curves.lineLength(v[0], v[3]);
      if ((len - chord) > error) {
        var lr = bezsplit(v);
        len = addifclose(lr[0], error) + addifclose(lr[1], error);
      }
      return len;
    };

    return function(a,b,c,d, error) {
      if (!error) error = 1;
      return addifclose([a,b,c,d], error);
    };
  })(),

  quadraticLengthPointVector : function(a,b,c,lt,error, dst) {
    var p1 = this.__tmp0, p2 = this.__tmp1;
    p1 = this.linePoint(a,b,2/3, p1);
    p2 = this.linePoint(b,c,1/3, p2);
    return this.cubicLengthPointVector(a,p1,p2,c, error, dst);
  },

  cubicLengthPointVector : function(a,b,c,d,lt,error, dst) {
    if (dst == null) dst = { point: vec3.create(), vector: vec3.create() };
    var len = this.cubicLength(a,b,c,d,error);
    var point = this.__tmp4;
    vec3.set(a, point);
    var prevpoint = this.__tmp5;
    vec3.set(a, prevpoint);
    var prevlensum = 0;
    var lensum = 0;
    var tl = lt*len;
    var segs = 20;
    var fac = 1/segs;
    // Fixed stepping over the cubic curve. Rich in error.
    for (var i=1; i<=segs; i++) {
      vec3.set(point, prevpoint);
      this.cubicPoint(a,b,c,d, fac*i, point);
      prevlensum = lensum;
      lensum += this.lineLength(prevpoint, point);
      if (lensum >= tl) {
        if (lensum == prevlensum) {
          vec3.set(point, dst.point);
          this.lineVector(a,b, dst.vector);
          return dst;
        }
        var dl = lensum - tl;
        var dt = dl / (lensum-prevlensum);
        this.linePoint(prevpoint, point, 1-dt, dst.point);
        this.cubicVector(a,b,c,d, fac*(i-dt), dst.vector);
        return dst;
      }
    }
    vec3.set(d, dst.point);
    this.lineVector(c,d, dst.vector);
    return dst;
  }
}



/**
  Color helper functions.
  */
Magi.Colors = {

  /**
    Converts an HSL color to its corresponding RGB color.

    @param h Hue in degrees (0 .. 359)
    @param s Saturation (0.0 .. 1.0)
    @param l Lightness (0.0 .. 1.0)
    @return The corresponding RGB color as [r,g,b]
    @type Array
    */
  hsl2rgb : function(h,s,l) {
    var r,g,b;
    if (s == 0) {
      r=g=b=l;
    } else {
      var q = (l < 0.5 ? l * (1+s) : l+s-(l*s));
      var p = 2 * l - q;
      var hk = (h % 360) / 360;
      var tr = hk + 1/3;
      var tg = hk;
      var tb = hk - 1/3;
      if (tr < 0) tr++;
      if (tr > 1) tr--;
      if (tg < 0) tg++;
      if (tg > 1) tg--;
      if (tb < 0) tb++;
      if (tb > 1) tb--;
      if (tr < 1/6)
        r = p + ((q-p)*6*tr);
      else if (tr < 1/2)
        r = q;
      else if (tr < 2/3)
        r = p + ((q-p)*6*(2/3 - tr));
      else
        r = p;

      if (tg < 1/6)
        g = p + ((q-p)*6*tg);
      else if (tg < 1/2)
        g = q;
      else if (tg < 2/3)
        g = p + ((q-p)*6*(2/3 - tg));
      else
        g = p;

      if (tb < 1/6)
        b = p + ((q-p)*6*tb);
      else if (tb < 1/2)
        b = q;
      else if (tb < 2/3)
        b = p + ((q-p)*6*(2/3 - tb));
      else
        b = p;
    }

    return [r,g,b];
  },

  /**
    Converts an HSV color to its corresponding RGB color.

    @param h Hue in degrees (0 .. 359)
    @param s Saturation (0.0 .. 1.0)
    @param v Value (0 .. 255) You can also use 0 .. 1.0.
    @return The corresponding RGB color as [r,g,b]
    @type Array
    */
  hsv2rgb : function(h,s,v) {
    var r,g,b;
    if (s == 0) {
      r=g=b=v;
    } else {
      h = (h % 360)/60.0;
      var i = Math.floor(h);
      var f = h-i;
      var p = v * (1-s);
      var q = v * (1-s*f);
      var t = v * (1-s*(1-f));
      switch (i) {
        case 0:
          r = v;
          g = t;
          b = p;
          break;
        case 1:
          r = q;
          g = v;
          b = p;
          break;
        case 2:
          r = p;
          g = v;
          b = t;
          break;
        case 3:
          r = p;
          g = q;
          b = v;
          break;
        case 4:
          r = t;
          g = p;
          b = v;
          break;
        case 5:
          r = v;
          g = p;
          b = q;
          break;
      }
    }
    return [r,g,b];
  }

}


R = function(start, end) {
  var a = [];
  for (var i=start; i<end; i++) a.push(i);
  return a;
};
Rg = function(start, last) {
  return R(start, last+1);
};

/**
  Delete the first instance of obj from the array.

  @param obj The object to delete
  @return true on success, false if array contains no instances of obj
  @type boolean
  @addon
  */
Array.prototype.deleteFirst = function(obj) {
  for (var i=0; i<this.length; i++) {
    if (this[i] == obj) {
      this.splice(i,1)
      return true
    }
  }
  return false
};

Array.prototype.stableSort = function(f) {
  for (var i=0; i<this.length; i++) {
    this[i].__stableSortIndex = i;
  }
  this.sort(function(a,b) {
    var v = f(a,b);
    if (v == 0)
      v = a.__stableSortIndex - b.__stableSortIndex;
    return v;
  });
  for (var i=0; i<this.length; i++) {
    delete this[i].__stableSortIndex;
  }
}

/**
  Returns true if f returns true for all elements in this.
  */
Array.prototype.all = function(f) {
  for (var i=0; i<this.length; i++) {
    if (!f(this[i], i, this)) return false
  }
  return true
}

/**
  Returns true if f returns true for any element in this.
  */
Array.prototype.any = function(f) {
  for (var i=0; i<this.length; i++) {
    if (f(this[i], i, this)) return true
  }
  return false
}

/**
  Returns true if all the elements in this are non-null attributes of obj.
  */
Array.prototype.allIn = function(obj) {
  return this.all(function(k){ return obj[k] != null })
}

/**
  Returns true if any element in this is a non-null attribute of obj.
  */
Array.prototype.anyIn = function(obj) {
  return this.any(function(k){ return obj[k] != null })
}

/**
  Compares two arrays for equality. Returns true if the arrays are equal.
  */
Array.prototype.equals = function(array) {
  if (!array) return false
  if (this.length != array.length) return false
  for (var i=0; i<this.length; i++) {
    var a = this[i]
    var b = array[i]
    if (a.equals && typeof(a.equals) == 'function') {
      if (!a.equals(b)) return false
    } else if (a != b) {
      return false
    }
  }
  return true
}

/**
  Rotates the first element of an array to be the last element.
  Rotates last element to be the first element when backToFront is true.

  @param {boolean} backToFront Whether to move the last element to the front or not
  @return The last element when backToFront is false, the first element when backToFront is true
  @addon
  */
Array.prototype.rotate = function(backToFront) {
  if (backToFront) {
    this.unshift(this.pop())
    return this[0]
  } else {
    this.push(this.shift())
    return this[this.length-1]
  }
}
/**
  Returns a random element from the array.

  @return A random element
  @addon
 */
Array.prototype.random = function() {
  return this[Math.floor(Math.random()*this.length)]
}

Array.prototype.flatten = function() {
  var a = []
  for (var i=0; i<this.length; i++) {
    var e = this[i]
    if (e.flatten) {
      var ef = e.flatten()
      for (var j=0; j<ef.length; j++) {
        a[a.length] = ef[j]
      }
    } else {
      a[a.length] = e
    }
  }
  return a
}

Array.prototype.take = function() {
  var a = []
  for (var i=0; i<this.length; i++) {
    var e = []
    for (var j=0; j<arguments.length; j++) {
      e[j] = this[i][arguments[j]]
    }
    a[i] = e
  }
  return a
}

if (!Array.prototype.pluck) {
  Array.prototype.pluck = function(key) {
    var a = []
    for (var i=0; i<this.length; i++) {
      a[i] = this[i][key]
    }
    return a
  }
}

Array.prototype.setProperty = function(key, value) {
  for (var i=0; i<this.length; i++) {
    this[i][key] = value
  }
}

// Match obj against pattern, return true if obj has all the keys in the pattern
// with values that equal the pattern values.
Object.match = function(obj, pattern) {
  for (var k in pattern) {
    var cond = pattern[k];
    if (typeof obj[k] == 'object' && typeof cond == 'object') {
      if (!Object.match(obj[k], cond))
        return false;
    } else {
      if (obj[k] != cond)
        return false;
    }
  }
  return;
};

Array.prototype.allWith = function() {
  var a = []
  topLoop:
  for (var i=0; i<this.length; i++) {
    var e = this[i]
    for (var j=0; j<arguments.length; j++) {
      var cond = arguments[j];
      if (typeof cond == 'object') {
        if (!Object.match(this[i], cond))
          continue topLoop
      } else if (typeof cond == 'function') {
        if (!this[i][cond(i)])
          continue topLoop
      } else {
        if (!this[i][cond])
          continue topLoop
      }
    }
    a[a.length] = e
  }
  return a
}

Array.prototype.bsearch = function(key) {
  var low = 0
  var high = this.length - 1
  while (low <= high) {
    var mid = low + ((high - low) >> 1) // low + (high - low) / 2, int division
    var midVal = this[mid]

    if (midVal < key)
      low = mid + 1
    else if (midVal > key)
      high = mid - 1
    else
      return mid
  }
  return -1
}

Array.prototype.sortNum = function() {
  return this.sort(function(a,b){ return (a > b ? 1 : (a < b ? -1 : 0)) })
}

Element.prototype.append = function() {
  for(var i=0; i<arguments.length; i++) {
    if (typeof(arguments[i]) == 'string') {
      this.appendChild(T(arguments[i]));
    } else {
      this.appendChild(arguments[i]);
    }
  }
};

// some common helper methods

if (!Function.prototype.bind) {
  /**
    Creates a function that calls this function in the scope of the given
    object.

      var obj = { x: 'obj' }
      var f = function() { return this.x }
      window.x = 'window'
      f()
      // => 'window'
      var g = f.bind(obj)
      g()
      // => 'obj'

    @param object Object to bind this function to
    @return Function bound to object
    @addon
    */
  Function.prototype.bind = function(object) {
    var t = this;
    return function() {
      return t.apply(object, arguments);
    };
  };
}

if (!Array.prototype.last) {
  /**
    Returns the last element of the array.

    @return The last element of the array
    @addon
    */
  Array.prototype.last = function() {
    return this[this.length-1]
  }
}
if (!Array.prototype.indexOf) {
  /**
    Returns the index of obj if it is in the array.
    Returns -1 otherwise.

    @param obj The object to find from the array.
    @return The index of obj or -1 if obj isn't in the array.
    @addon
    */
  Array.prototype.indexOf = function(obj) {
    for (var i=0; i<this.length; i++)
      if (obj == this[i]) return i
    return -1
  }
}
/**
  Iterate function f over each element of the array and return an array
  of the return values.

  @param f Function to apply to each element
  @return An array of return values from applying f on each element of the array
  @type Array
  @addon
  */
Array.prototype.map = function(f) {
  var na = new Array(this.length)
  if (f)
    for (var i=0; i<this.length; i++) na[i] = f(this[i], i, this)
  else
    for (var i=0; i<this.length; i++) na[i] = this[i]
  return na
}
Array.prototype.unique = function() {
  var a = [this[0]];
  for (var i=1; i<this.length; i++) {
    if (this[i] != this[i-1])
      a.push(this[i]);
  }
  return a;
}
Array.prototype.forEach = function(f) {
  for (var i=0; i<this.length; i++) f(this[i], i, this)
}
Array.prototype.set = function(newVal) {
  this.splice(newVal.length);
  for (var i=0; i<newVal.length; i++)
    this[i] = newVal[i];
  return this;
}
if (!Array.prototype.reduce) {
  Array.prototype.reduce = function(f, s) {
    var i = 0
    if (arguments.length == 1) {
      s = this[0]
      i++
    }
    for(; i<this.length; i++) {
      s = f(s, this[i], i, this)
    }
    return s
  }
}
if (!Array.prototype.find) {
  Array.prototype.find = function(f) {
    for(var i=0; i<this.length; i++) {
      if (f(this[i], i, this)) return this[i]
    }
  }
}

if (!String.prototype.capitalize) {
  /**
    Returns a copy of this string with the first character uppercased.

    @return Capitalized version of the string
    @type String
    @addon
    */
  String.prototype.capitalize = function() {
    return this.replace(/^./, this.slice(0,1).toUpperCase())
  }
}

if (!String.prototype.escape) {
  /**
    Returns a version of the string that can be used as a string literal.

    @return Copy of string enclosed in double-quotes, with double-quotes
            inside string escaped.
    @type String
    @addon
    */
  String.prototype.escape = function() {
    return '"' + this.replace(/"/g, '\\"') + '"'
  }
}
if (!String.prototype.splice) {
  String.prototype.splice = function(start, count, replacement) {
    return this.slice(0,start) + replacement + this.slice(start+count)
  }
}
if (!String.prototype.strip) {
  /**
    Returns a copy of the string with preceding and trailing whitespace
    removed.

    @return Copy of string sans surrounding whitespace.
    @type String
    @addon
    */
  String.prototype.strip = function() {
    return this.replace(/^\s+|\s+$/g, '')
  }
}

if (!Math.sinh) {
  /**
    Returns the hyperbolic sine of x.

    @param x The value for x
    @return The hyperbolic sine of x
    @addon
    */
  Math.sinh = function(x) {
    return 0.5 * (Math.exp(x) - Math.exp(-x))
  };
  /**
    Returns the inverse hyperbolic sine of x.

    @param x The value for x
    @return The inverse hyperbolic sine of x
    @addon
    */
  Math.asinh = function(x) {
    return Math.log(x + Math.sqrt(x*x + 1))
  };
}
if (!Math.cosh) {
  /**
    Returns the hyperbolic cosine of x.

    @param x The value for x
    @return The hyperbolic cosine of x
    @addon
    */
  Math.cosh = function(x) {
    return 0.5 * (Math.exp(x) + Math.exp(-x))
  };
  /**
    Returns the inverse hyperbolic cosine of x.

    @param x The value for x
    @return The inverse hyperbolic cosine of x
    @addon
    */
  Math.acosh = function(x) {
    return Math.log(x + Math.sqrt(x*x - 1))
  }
}
Math.Ln2 = Math.log(2);
Math.Ln10 = Math.log(10);
Math.log2 = function(x) {
  return Math.log(x) / Math.Ln2;
}
Math.log10 = function(x) {
  return Math.log(x) / Math.Ln10;
}
Math.isPowerOfTwo = function(x) {
  var l = Math.log2(x);
  return (Math.floor(l) == l);
}

