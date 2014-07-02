var through = require('through');

function SocketIOStream(socket, options) {
  if (!(this instanceof SocketIOStream)) return new SocketIOStream(server, options);

  this.stream = through(this.write.bind(this), this.end.bind(this));

  this.stream.socketioStream = this;
  this.options = options || {};
  this._buffer = [];

  this.socket = socket;
  if (this.socket.connected) {
    this.onOpen();
  } else {
    this.socket.on('connect', this.onOpen.bind(this));
  }
  this.socket.on('message', this.onMessage.bind(this));
  this.socket.on('error', this.onError.bind(this));
  this.socket.on('disconnect', this.onClose.bind(this));

  return this.stream;
}

module.exports = SocketIOStream;
module.exports.SocketIOStream = SocketIOStream;

SocketIOStream.prototype.onMessage = function(e) {
  var data = e;
  if (typeof data.data !== 'undefined') data = data.data;

  // type must be a Typed Array (ArrayBufferView)
  var type = this.options.type;
  if (type && data instanceof ArrayBuffer) data = new type(data);

  this.stream.queue(data);
};

SocketIOStream.prototype.onError = function(err) {
  this.stream.emit('error', err);
};

SocketIOStream.prototype.onClose = function(err) {
  if (this._destroy) return;
  this.stream.emit('end');
  this.stream.emit('close');
};

SocketIOStream.prototype.onOpen = function(err) {
  if (this._destroy) return;
  this._open = true;
  for (var i = 0; i < this._buffer.length; i++) {
    this._write(this._buffer[i]);
  }
  this._buffer = undefined;
  this.stream.emit('open');
  this.stream.emit('connect');
};

SocketIOStream.prototype.write = function(data) {
  if (!this._open) {
    this._buffer.push(data);
  } else {
    this._write(data);
  }
};

SocketIOStream.prototype._write = function(data) {
  if (this.socket.connected) {
    console.log('message', data);
    this.socket.emit('message', data);
  } else {
    this.stream.emit('error', 'Not connected');
  }
};

SocketIOStream.prototype.end = function(data) {
  if (data !== undefined) this.stream.queue(data);
  this._end = true;
};
