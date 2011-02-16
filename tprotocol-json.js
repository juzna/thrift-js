/**
 * JSON protocol
 */
require('./lib_tools').setup(Object, Array, Function); // Add useful stuff
var TBase = require('./tbase'),
  types = TBase.types,
  Class = require('./lib_class').Class,
  FIFO = require('./lib_fifo').FIFO,
  Buffer = require('buffer').Buffer,
  _;


// Map of types
var mapType = exports.mapType = {};
mapType[types.BOOL   ] = 'tf';
mapType[types.BYTE   ] = 'i8';
mapType[types.I16    ] = 'i16';
mapType[types.I32    ] = 'i32';
mapType[types.I64    ] = 'i64';
mapType[types.DOUBLE ] = 'dbl';
mapType[types.STRUCT ] = 'rec';
mapType[types.STRING ] = 'str';
mapType[types.MAP    ] = 'map';
mapType[types.LIST   ] = 'lst';
mapType[types.SET    ] = 'set';

// Create reversed map of types
var mapRType = exports.mapRType = {};
for(var i in mapType) mapRType[mapType[i]] = i;

// Comma reference
var comma = {};

// Write as JSON string
function str(x) {
  return JSON.stringify(String(x));
}
function toVal(x) {
  return { value: x };
}

var Proto = exports.ThriftJSONProtocol = Class({
  /**
   * Initializes new protocol
   * @param transport
   */
  init: function(transport) {
    this.transport = transport;
    this.context = [ [ 'TOP' ] ];

    this.fifo = null; // Output queue (which can serve as buffer as well)
    this.incoming = null;
  },

  // Protocol version
  version: 1,


  /*************     Write methods    **********/

  /**
   * Write all arguments to buffer
   * @return int Number of written bytes
   */
  _write: function() {
    var item, sum = 0;

    // We're writing map, writing key, and we're not the first one
    if(this.context[0][0] === 'map' && this.context[0][1] && this.context[0][2]++ > 0) sum += this.fifo.write(', ');

    for(var i = 0; i < arguments.length; i++) {
      var item = arguments[i];

      // Convert to string if needed
      if(item === comma) item = ', ';
      else if(item instanceof Buffer) { }
      else if(typeof item !== 'string') item = String(item);

      sum += this.fifo.write(item);
    }

    // We are in map
    if(this.context[0][0] == 'map') {
      if(!(this.context[0][1] = !this.context[0][1])) {
        sum += this.fifo.write(': ');
      }
    }

    return sum;
  },

  writeMessageBegin: function(name, messageType, seqid) {
    this.fifo = new FIFO; // Initialize new buffer
    return this._write('[ ', this.version, comma, str(name), comma, messageType, comma, seqid, comma);
  },

  writeMessageEnd: function() {
    var x = this._write(' ]');

    // Write to transport and flush it
    this.transport.write(this.fifo.peek());
    this.transport.flush();

    return x;
  },

  writeStructBegin: function(name) {
    this.context.unshift([ 'struct', 0 ]); // Struct + counter
    return this._write('/** struct ' + name + '*/ { ');
  },

  writeStructureEnd: function() {
    this.context.shift();

    return this._write(' } ');
  },

  writeFieldBegin: function(name, fieldType, fieldId) {
    return this._write(
      (this.context[0][1]++ ? ', ' : '') +
      ' { ' + str(fieldId) + ': { ' + str(mapType[fieldType]) + ': '
    );
  },

  writeFieldEnd: function() {
    return this._write(' } } ');
  },

  writeFieldStop: function() {
    // nothing to do
  },

  writeMapBegin: function(keyType, valType, size) {
    this.context.unshift( [ 'map', true, 0 ] ); // Map + writingKey? + counter
    return this._write(' [ ', str(mapType[keyType]), comma, str(mapType[valType]), comma, size, comma, ' { ');
  },

  writeMapEnd: function() {
    this.context.shift();
    return this._write(' } ] ');
  },

  writeListBegin: function(elemType, size) {
    this.context.unshift('list');
    return this._write(' [ ', str(mapType(elemType)), comma, size, comma);
  },

  writeListEnd: function() {
    this.context.shift();
    return this._write(' ] ');
  },

  writeSetBegin: function(elemType, size) {
    this.context.unshift('set');
    return this._write(' [ ', str(mapType(elemType)), comma, size, comma);
  },

  writeSetEnd: function() {
    this.context.shift();
    return this._write(' ] ');
  },

  writeBool: function(value) {
    return this._write(value ? 1 : 0);
  },

  writeByte: function(i8) {
    return this._write(i8);
  },

  writeI16 : function(i16){
    return this._write(i16);
  },

  writeI32 : function(i32){
    return this._write(i32);
  },

  writeI64 : function(i64){
    return this._write(i64);
  },

  writeDouble : function(dbl){
    return this._write(dbl);
  },

  writeString: function(x) {
    return this._write(str(x))
  },

  writeBinary: function(x) {
    // TODO: encode base64
    return this._write(x);
  },



  /*************     Read methods    **********/

  readMessageBegin: function() {
    // Parse incoming JSON object
    var buf = JSON.parse(this.transport.readAll());

    if(buf[0] != this.version) throw new Error('Unknown version: ' + buf[0]);

    var ret = {
      version: buf[0],
      fname: buf[1],
      mtype: buf[2],
      rseqid: buf[3]
    };

    // Populate rest
    this.incoming = buf.slice(4);

    return ret;
  },

  readMessageEnd: function() {
    // nothing to do
  },

  readStructBegin: function() {
    this.context.unshift([ 'struct', this.incoming.shift() ]); // Struct + contents as object
    return { fname: '' }; // Name it not there
  },

  readStructureEnd: function() {
    this.context.shift();
  },

  readFieldBegin: function() {
    // Take first key from object
    for(var fId in this.context[0][1]) break;
    if(typeof fId === 'undefined') throw new Error('Key is missing');

    // Take type
    for(var fType in this.context[0][1][fId]) break;

    var ret = {
      fid: fId,
      ftype: mapRType[fType],
      fname: ''
    };

    // Put value back to queue
    this.incoming.unshift(this.context[0][1][fId][fType]);

    // Remote it from struct-context
    delete this.context[0][1][fId];

    return ret;
  },

  readFieldEnd: function() {
    // n/a
  },

  readMapBegin: function() {
    var map = this.incoming.shift();
    var ret = {
      ktype: mapRType[map[0]],
      vtype: mapRType[map[1]],
      size:  map[2]
    };

    // Make simple list from rest of it
    var contents = map[3], list = [];
    for(var i in contents) {
      list.push(i, contents[i]);
    }

    // Put this list at the beginning of incoming
    Array.prototype.unshift.apply(this.incoming, list);

    return ret;
  },

  readMapEnd: function() {
    // n/a
  },

  readListBegin: function() {
    var lst = this.incoming.shift();
    var ret = {
      etype: mapRType[lst[0]],
      size:  lst[1]
    };

    // Put this list at the beginning of incoming
    Array.prototype.unshift.apply(this.incoming, list.slice(2));

    return ret;
  },

  readListEnd: function() {
    // n/a
  },

  readSetBegin: function(elemType, size) {
    return this.readListBegin();
  },

  readSetEnd: function() {
    return this.readListEnd();
  },

  readBool: function(value) {
    return toVal(this.incoming.shift() ? true : false);
  },

  readByte: function(i8) {
    return toVal(this.incoming.shift());
  },

  readI16 : function(i16){
    return toVal(this.incoming.shift());
  },

  readI32 : function(i32){
    return toVal(this.incoming.shift());
  },

  readI64 : function(i64){
    return toVal(this.incoming.shift());
  },

  readDouble : function(dbl){
    return toVal(this.incoming.shift());
  },

  readString: function(x) {
    return toVal(this.incoming.shift());
  },

  readBinary: function(x) {
    // TODO: decode base64
    return toVal(this.incoming.shift());
  }
});
