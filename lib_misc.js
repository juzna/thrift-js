/**
 * Some useful functions
 */

exports.merge = function merge(a, b) {
  var ret = [];
  for(var i = 0; i < a.length; i++) ret.push(a[i]);
  for(var i = 0; i < b.length; i++) ret.push(b[i]);
  return ret;
}

exports.ip2long = function(s) {
  var x = s.split(/\./);
  return (x[0] << 24) | (x[1] << 16) | (x[2] << 8) | x[3];
}

exports.long2ip = function(i) {
  return [
    i >> 24 & 0xff,
    i >> 16 & 0xff,
    i >> 8 & 0xff,
    i & 0xff
  ].join('.');
}

exports.compareIP = function(a, b) {
  function str(s) {
    return s.split(/\./).map(function(i) { var x = parseInt(i).toString(16); return x.length == 1 ? '0' + x : x; }).join(' ');
  }
  var aa = str(a), bb = str(b);
  
  return aa == bb ? 0 : (aa < bb ? -1 : 1);
}

// Filter for interesting IPs
exports.filterIP = function(item) {
  return item
    && item.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
    && !item.match(/^192\.168\.[012]\.\d+$/)    // Behind NAT
    && !item.match(/^10\.87\.\d+\.\d+$/)        // TV, fuck off
  ;
}

// Compare two buffers
exports.buffCompare = function(buf1, buf2) {
  if(!(buf1 instanceof Buffer)) return false;
  if(!(buf2 instanceof Buffer)) return false;
  if(buf1.length != buf2.length) return false;

  for(var i = 0; i < buf1.length; i++) if(buf1[i] != buf2[i]) return false;

  return true;
}
