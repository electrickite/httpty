const config = require('config');
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const pty = require('node-pty');
const ws = require('socket.io');

['log', 'warn', 'error'].forEach(function(method) {
  var oldMethod = console[method].bind(console);
  console[method] = function() {
    arguments[0] = new Date().toISOString() + ' [' + method.toUpperCase() + '] ' + arguments[0];
    oldMethod.apply(
      console,
      Array.from(arguments)
    );
  };
});

process.on('uncaughtException', function(e) {
  console.error(e);
});

let app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

var server;
if (config.has('tls.cert') && config.has('tls.key')) {
  server = https.createServer({
    key: fs.readFileSync(config.get('tls.key')),
    cert: fs.readFileSync(config.get('tls.cert'))
  }, app);
} else {
  server = http.createServer(app);
}

server.listen(config.get('port'), function() {
  if (config.has('group')) { process.setgid(config.get('group')); }
  if (config.has('user')) { process.setuid(config.get('user')); }
  console.log('HTTP server listening on port %s', config.get('port'));
  console.log('User: %s    Group: %s', process.getuid(), process.getgid());
});

let io = ws(server, {path: '/socket'});

io.on('connection', function(socket) {
  console.log('SID=%s CONNECTED', socket.id);

  var term = pty.spawn(config.get('command.path'), config.get('command.arguments'), {
    name: 'xterm-256color',
    cols: 80,
    rows: 30
  });
  console.log("PID=%s CREATED for SID=%s", term.pid, socket.id);

  term.on('data', function(data) {
    socket.emit('output', data);
  });

  term.on('exit', function(code) {
    socket.emit('exit');
    console.log("PID=%s EXITED", term.pid)
  });

  socket.on('resize', function(data) {
    if (term._writable) {
      term.resize(data.col, data.row);
    }
  });

  socket.on('input', function(data) {
    if (term._writable) {
      term.write(data);
    }
  });

  socket.on('disconnect', function() {
    console.log('SID=%s DISCONNECTED', socket.id);
    term.end();
  });
});
