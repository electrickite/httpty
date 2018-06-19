const pty = require('node-pty');

module.exports = function(socket, opts) {
  opts = Object.assign({command: "/bin/sh", args: []}, opts);

  console.log('SID=%s CONNECTED', socket.id);
  if (opts.motd) { socket.emit('message', opts.motd); }

  socket.term = pty.spawn(opts.command, opts.args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 30
  });
  console.log("PID=%s CREATED for SID=%s", socket.term.pid, socket.id);

  socket.term.on('data', function(data) {
    socket.emit('output', data);
  });

  socket.term.on('exit', function(code) {
    socket.emit('exit');
    console.log("PID=%s EXITED", socket.term.pid)
  });

  socket.on('resize', function(data) {
    if (socket.term._writable) {
      socket.term.resize(data.col, data.row);
    }
  });

  socket.on('input', function(data) {
    if (socket.term._writable) {
      socket.term.write(data);
    }
  });

  socket.on('disconnect', function() {
    console.log('SID=%s DISCONNECTED', socket.id);
    socket.term.end();
  });
};
