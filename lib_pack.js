/**
 * Packing un unpacking
 * Decoders are based on code from http://github.com/mranney/node_pcap/ with some modifications
 */


// Pack numbers or other data stuctures to binary format
var pack = {
  ethernet_addr: function (mac, buf, offset) {
    var parts = mac.split(':');
    if(parts.length != 6) return false;

	  for(var i = 0; i < 6; i++) buf[offset + i] = parseInt(parts[i], 16);
	  return true;
  },
  
  uint16: function (num, buf, offset) {
	  buf[offset] = (num >> 8) & 0xff;
	  buf[offset + 1] = num & 0xff;
    return true;
  },

  uint32: function (num, buf, offset) {
	  buf[offset] = (num >> 24) & 0xff;
	  buf[offset + 1] = (num >> 16) & 0xff;
	  buf[offset + 2] = (num >> 8) & 0xff;
	  buf[offset + 3] = (num) & 0xff;
  },

  uint64: function (num, buf, offset) {
	  buf[offset] = (num >> 56) & 0xff;
	  buf[offset + 1] = (num >> 48) & 0xff;
	  buf[offset + 2] = (num >> 40) & 0xff;
	  buf[offset + 3] = (num >> 32) & 0xff;
	  buf[offset + 4] = (num >> 24) & 0xff;
	  buf[offset + 5] = (num >> 16) & 0xff;
	  buf[offset + 6] = (num >> 8) & 0xff;
	  buf[offset + 7] = (num) & 0xff;
  },

  ipv4_addr: function (ip, buf, offset) {
    var parts = ip.split('.');
  	if(parts.length != 4) return false;

	  for(var i = 0; i < 4; i++) buf[offset + i] = parseInt(parts[i]);
	  return true;
  },
};
exports.pack = pack;


var unpack = {
    ethernet_addr: function (raw_packet, offset) {
        return [
            lpad(raw_packet[offset].toString(16), 2),
            lpad(raw_packet[offset + 1].toString(16), 2),
            lpad(raw_packet[offset + 2].toString(16), 2),
            lpad(raw_packet[offset + 3].toString(16), 2),
            lpad(raw_packet[offset + 4].toString(16), 2),
            lpad(raw_packet[offset + 5].toString(16), 2)
        ].join(":");
    },
    uint16: function (raw_packet, offset) {
        return ((raw_packet[offset] * 256) + raw_packet[offset + 1]);
    },
    uint32: function (raw_packet, offset) {
        return (
            (raw_packet[offset] * 16777216) +
            (raw_packet[offset + 1] * 65536) +
            (raw_packet[offset + 2] * 256) +
            raw_packet[offset + 3]
        );
    },
    uint64: function (raw_packet, offset) {
        return (
            (raw_packet[offset] * 72057594037927936) +
            (raw_packet[offset + 1] * 281474976710656) +
            (raw_packet[offset + 2] * 1099511627776) +
            (raw_packet[offset + 3] * 4294967296) +
            (raw_packet[offset + 4] * 16777216) +
            (raw_packet[offset + 5] * 65536) +
            (raw_packet[offset + 6] * 256) +
            raw_packet[offset + 7]
        );
    },
    ipv4_addr: function (raw_packet, offset) {
        return [
            raw_packet[offset],
            raw_packet[offset + 1],
            raw_packet[offset + 2],
            raw_packet[offset + 3]
        ].join('.');
    }
};
exports.unpack = unpack;
