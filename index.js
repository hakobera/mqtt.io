var sio = require('socket.io');
var ss = require('socket.io-stream');
var mqtt = require('mqtt');
var http = require('http');
var https = require('https');

module.exports.attachServer = function(server, handler) {
  var io = sio(server);

  io.on('connection', function (socket) {
    var stream = ss(socket);
    var con = new mqtt.MqttConnection();

    stream.on('error', con.emit.bind(con, 'error'));
    stream.on('close', con.emit.bind(con, 'close'));

    if (handler) {
      handler(con);
    }
  });

  return io;
};

module.exports.createServer = function(handler) {
  var server = http.createServer();
  module.exports.attachServer(server, handler);
  return server;
};

module.exports.createSecureServer = function(httpsOpts, handler) {
    var server = https.createServer(httpsOpts);
    module.exports.attachServer(server, handler);
    return server;
};
