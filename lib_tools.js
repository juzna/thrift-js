/**
 * Basic tools
 *
 * Add some useful features to Object, Array and Function, just call
 *   require('./lib_tools').setup(Object, Array, Function)
 *
 */

function extend(dst, src) {
  for(var i in src) dst[i] = src[i];
  return dst;
}


/**
* Basic setup
*/
exports.setup = function(Object, Array, Function) {

// Object methods
extend(Object, {
  extend: extend,
  
  isArray: function(x) {
    return !!x.__proto__.constructor.toString().match(/function Array/);
  },

  values: function(x) {
    var ret = [];
    for(var i in x) ret.push(x[i]);
    return ret;
  },

  keys: function(x) {
    var ret = [];
    for(var i in x) ret.push(i);
    return ret;
  },
  
  clone: function(x) {
    var ret = {};
    for(var i in x) ret[i] = x[i];
    return ret;
  },
  
  cloneDeep: function(x) {
    return JSON.parse(JSON.stringify(x));
  },
});


// Array static methods
extend(Array, {
  merge: function(a, b) {
    return a.copy().merge(b);
  },
  
  copy: function(a) {
    return a.copy();
  },
  
  is: function(a) {
    return Object.isArray(a);
  },
    
});


// Array methods
extend(Array.prototype, {
  merge: function(b) {
    for(var i = 0; i < b.length; i++) this.push(b[i]);
    return this;
  },
  
  copy: function() {
    return this.slice(0, this.length);
  },
  
  include: function(object) {
    return (this.indexOf(object) !== -1);
  },
    
  uniq: function() {
    var ret = [];
    this.forEach(function(i) { if(ret.indexOf(i) === -1) ret.push(i); });
    return ret;
  },
  
  pluck: function(prop) {
    return this.map(function(item) { return item && item[prop]; });
  },
  
  compact: function() {
    return this.filter(function(value) {
      return value != null;
    });
  },
  
  
});


extend(Function.prototype, {
  getClassName: function() {
    try {
      return this.__proto__.constructor.toString().match(/function (.*)\(/)[1];
    }
    catch(e) {}
  },
});


} // eof: setup
