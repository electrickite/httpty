let config = require('config');
let express = require('express');
let http = require('http');
let https = require('https');
let path = require('path');
let pty = require('node-pty');
let server = require('socket.io');

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

let port = config.get('port');
let httpserv = http.createServer(app).listen(port, function() {
  console.log('HTTP server listening on port ' + port);
});

let io = server(httpserv, {path: '/socket'});

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
    console.log("PID=" + term.pid + " EXITED")
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
