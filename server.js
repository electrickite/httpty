const config = require('config');

const app = require('./server/app');
const createHttpServer = require('./server/http');
const createWebSocketServer = require('./server/wss');
const timestamps = require('./server/timestamps');

process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

if (config.get('timestamps')) {
  timestamps.add();
}

const http = createHttpServer(app, config.get('server'));
const wss = createWebSocketServer(http, config.get('client'));
