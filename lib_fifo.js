/**
 * Implementation if FIFO (queue)
 */

var Buffer = require('buffer').Buffer,
    Class = require('./lib_class').Class,
    _;


/**
* FIFO buffer with autoresize
*/
var FIFO = exports.FIFO = Class({
  init: function(size) {
    this.size = size || 4096;
    this.start = this.end = 0;
    this.buffer = new Buffer(this.size);
  },
  
  length: function() {
    return this.end - this.start;
  },
  
  available: function(len) {
    return this.length() >= len;
  },
  
  peek: function() {
    if(this.start == this.end) return false;
    else return this.buffer.slice(this.start, this.end);
  },
  
  peekString: function() {
    if(this.start == this.end) return '';
    else return this.buffer.slice(this.start, this.end).toString('ascii');
  },
  
  read: function(len, skip) {
    if(this.end - this.start < len) throw new Error("Not enough data");
    var ret = this.buffer.slice(this.start, this.start + len);
    this.start += len;
    
    if(skip) this.skip(skip);
    
    return ret;
  },
  
  skip: function(len) {
    this.start += len;
  },
  
  skipRegMatch: function(x) {
    this.skip(x.index + x[0].length);
  },
  
  write: function(buf) {
    if(!(buf instanceof Buffer)) buf = new Buffer(buf);
    var len = buf.length;
    
    // If not enough space, make some
    if(this.end + len > this.size) this.requiredMoreSpace(len);
    
    // Copy new data to our buffer
    buf.copy(this.buffer, this.end, 0);
    this.end += len;
    return len;
  },
  
  clear: function() {
    this.start = this.end = 0;
  },
  
  // Make more space if needed
  requiredMoreSpace: function(len) {
    // Double size if needed
    var requiredLen = this.end - this.start + len;
    while(requiredLen > this.size) this.size *= 2;
    
    // Prepare swap buffer
    var buf = new Buffer(this.size);
    this.buffer.copy(buf, 0, this.start, this.end);
    
    // Swap 'em
    this.buffer = buf;
    
    this.end -= this.start;
    this.start = 0;
  },
  
  // Find position of char
  find: function(chr, offset) {
    if(offset === undefined) offset = 0;
    
    for(var i = this.start + offset; i < this.end; ++i) {
      if(this.buffer[i] == chr) return i - this.start;
    }
  }
  
});

/***********
// TESTING FOR FIFO
var f = new FIFO(5);
console.log('Size:', sys.inspect(f.size));
console.log('Length:', sys.inspect(f.length()));
console.log('Avail :', sys.inspect(f.available(2)));

console.log('Write', "\n");
f.write("ahoj ka");

console.log('Size:', sys.inspect(f.size));
console.log('Length:', sys.inspect(f.length()));
console.log('Avail :', sys.inspect(f.available(4)));
console.log('Peek :', sys.inspect(f.peek()));
console.log();

console.log('Read :', sys.inspect(f.read(4)));
console.log('Size:', sys.inspect(f.size));
console.log('Length:', sys.inspect(f.length()));
console.log('Avail :', sys.inspect(f.available(4)));
console.log('Peek :', sys.inspect(f.peek()));

return;
*****************************/

