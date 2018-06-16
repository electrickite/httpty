const config = require('config');
const express = require('express');
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const pty = require('node-pty');
const util = require('util');
const ws = require('socket.io');


// Logging and error handling
process.on('uncaughtException', function(err) {
  console.error(err.stack);
});

if (config.get('timestamps')) {
  ['log', 'warn', 'error'].forEach(function(method) {
    var oldMethod = console[method].bind(console);
    console[method] = function() {
      arguments[0] = util.format('%s [%s] %s', new Date().toISOString(), method.toUpperCase(), arguments[0]);
      oldMethod.apply(console, Array.from(arguments));
    };
  });
}


// Routing and response configuration
let app = express();
app.use('/', express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, 'public/404.html'));
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, 'public/500.html'));
});


// HTTP server creation
var server;
if (config.has('tls')) {
  server = https.createServer({
    key: fs.readFileSync(config.get('tls.key')),
    cert: fs.readFileSync(config.get('tls.cert'))
  }, app);
} else {
  server = http.createServer(app);
}

server.listen(config.get('port'), function() {
  // Switch process UIG/GID after port binding
  if (config.has('group')) { process.setgid(config.get('group')); }
  if (config.has('user')) { process.setuid(config.get('user')); }
  console.log('HTTP server listening on port %s', config.get('port'));
  console.log('Process UID=%s  GID=%s', process.getuid(), process.getgid());
});


// Web socket initialization and behavior
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
