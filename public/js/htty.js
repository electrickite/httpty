var term;
var socket = io(location.origin, {path: '/socket'})
var buf = '';

function Htty(argv) {
  this.argv_ = argv;
  this.io = null;
  this.pid_ = -1;
}

Htty.prototype.run = function() {
  this.io = this.argv_.io.push();

  this.io.onVTKeystroke = this.sendString_.bind(this);
  this.io.sendString = this.sendString_.bind(this);
  this.io.onResize = this.onResize.bind(this);
}

Htty.prototype.sendString_ = function(str) {
  socket.emit('input', str);
};

Htty.prototype.onResize = function(col, row) {
  socket.emit('resize', { col: col, row: row });
};

function bufferedWrite(data) {
  if (!term) {
    buf += data;
    return;
  }
  term.io.writeUTF16(data);
}

socket.on('connect', function() {
  lib.init(function() {
    hterm.defaultStorage = new lib.Storage.Local();
    term = new hterm.Terminal();
    window.term = term;
    term.decorate(document.getElementById('terminal'));
    term.installKeyboard();

    term.setCursorPosition(0, 0);
    term.setCursorVisible(true);
    term.prefs_.set('ctrl-c-copy', true);
    term.prefs_.set('ctrl-v-paste', true);
    term.prefs_.set('use-default-window-copy', true);
    term.prefs_.set('enable-dec12', true);
    term.prefs_.set('cursor-blink', true)

    term.runCommandClass(Htty, document.location.hash.substr(1));
    socket.emit('resize', {
      col: term.screenSize.width,
      row: term.screenSize.height
    });

    term.io.println("Terminal connected");

    if (buf && buf != '') {
      term.io.writeUTF16(buf);
      buf = '';
    }
  });
});

socket.on('output', function(data) {
  bufferedWrite(data);
});

socket.on('exit', function() {
  bufferedWrite("Terminal disconnected: refresh to reconnect\r\n");
  socket.close();
});

socket.on('disconnect', function() {
  console.log("Socket.io connection closed");
});
