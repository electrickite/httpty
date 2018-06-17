const pty = require('node-pty');

module.exports = function(socket, opts) {
  var opts = Object.assign({command: "/bin/sh", args: []}, opts);

  console.log('SID=%s CONNECTED', socket.id);
  if (opts.motd) { socket.emit('message', opts.motd); }

  let term = pty.spawn(opts.command, opts.args, {
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
};
