const Client = require('./client');
const WebSocket = require('ws');

const clients = {};

module.exports = function(http, opts) {
  opts = Object.assign({
    command: '/bin/sh',
    args: [],
    connections: 10,
    ping: 60
  }, opts);
  opts.connections = parseInt(opts.connections);
  opts.ping = parseInt(opts.ping);


  var wss = new WebSocket.Server({ server: http, path: '/ws' });

  wss.on('connection', function(ws) {
    var client = new Client(ws);
    clients[client.id] = client;

    client.on('disconnected', function() {
      delete clients[client.id];
    });

    if (opts.motd) {
      client.alert(opts.motd);
    }

    if (Object.keys(clients).length <= opts.connections) {
      client.startTty(opts.command, opts.args);
    } else {
      console.log('CID=%s REJECT - Connection limit exceeded');
      client.error('Too many connections');
      client.disconnect();
    }
  });

  if (opts.ping) {
    wss.pingInterval = setInterval(function() {
      for (var id in clients) {
        clients[id].ping();
      }
    }, opts.ping*1000);
  }

  return wss;
};
