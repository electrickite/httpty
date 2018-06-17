const config = require('config');
const ws = require('socket.io');

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

const app = require('./server/app');
const createServer = require('./server/http');
const initTerminal = require('./server/terminal');
const timestamps = require('./server/timestamps');

if (config.get('timestamps')) {
  timestamps.add();
}

let server = createServer(app, config.get('server'));
let io = ws(server, {path: '/socket'});

io.on('connection', function(socket) {
  initTerminal(socket, config.get('terminal'));
});
