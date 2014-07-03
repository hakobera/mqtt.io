var mosca = require('mosca');
var mqtt = require('mqtt');
var SocketIOStream = require('./lib/sioStream');

var ascoltatore = {
  type: 'redis',
  redis: require('redis'),
  db: 12,
  port: 6379,
  return_buffers: true, // to handle binary payloads
  host: "localhost"
};

var moscaSettings = {
  port: 1883,
  backend: ascoltatore,
  persistence: {
    factory: mosca.persistence.Redis
  },
  http: {
    port: 8080,
    static: __dirname + '/sample'
  }
};

var attachServer = function (server, handler) {
  var io = require('socket.io')(server, {
    transports: ['polling']
  });
  var room = io.of('/mqtt');
  room.on('connection', function (socket) {
    var stream = new SocketIOStream(socket);
    var connection = stream.pipe(mqtt.MqttConnection());

    stream.on('error', connection.emit.bind(connection, 'error'));
    stream.on('close', connection.emit.bind(connection, 'close'));

    if (handler) {
      handler(connection);
    }

    server.emit("client", connection);
  });
};

mosca.Server.prototype.attachHttpServer = function(server) {
  var that = this;
  attachServer(server, function (conn) {
    new mosca.Client(conn, that);
  });
};

var server = new mosca.Server(moscaSettings);
server.on('ready', function () {
  console.log('Mosca server is up and running');
});

server.on('clientConnected', function(client) {
    console.log('client connected', client.id);
});

// fired when a message is received
server.on('published', function(packet, client) {
  console.log('Published', packet.payload);
});

//in case of an error
process.on("uncaughtException", function(error) {
  return console.log(error.stack);
});
