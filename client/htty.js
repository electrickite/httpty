var term;
var ws = createWebSocket();
var buf = '';
var MSG = {
  DATA: '00',
  ERROR: '01',
  ID: '02',
  ALERT: '03',
  RESIZE: '04'
};

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
  sendMessage(str, MSG.DATA);
};

Htty.prototype.onResize = function(col, row) {
  sendResize(col, row);
};

function bufferedWrite(data) {
  if (!term) {
    buf += data;
    return;
  }
  term.io.writeUTF16(data);
}

function createWebSocket() {
  var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
  return new WebSocket(protocolPrefix + '//' + location.host + '/ws');
}

function sendMessage(msg, type) {
  ws.send(type + msg);
}

function sendResize(col, row) {
  sendMessage(col + '|' + row, MSG.RESIZE);
}

ws.onopen = function() {
  console.log("Web socket connected.");

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
    sendResize(term.screenSize.width, term.screenSize.height);
    term.io.println("Terminal connected");

    if (buf && buf != '') {
      term.io.writeUTF16(buf);
      buf = '';
    }
  });
};

ws.onmessage = function(event) {
  if (typeof event.data != 'string' || event.data.length < 2) {
    console.error('Malformed message received: ' + event.data);
    return;
  }

  var type = event.data.substring(0, 2);
  var data = event.data.substring(2);

  switch(type) {
    case MSG.DATA:
      bufferedWrite(data);
      break;
    case MSG.ALERT:
      bufferedWrite(data + "\r\n");
      break;
    case MSG.ID:
      console.log('Client ID: ' + data);
      break;
    case MSG.ERROR:
      console.error('ERROR: ' + data);
      bufferedWrite(data + "\r\n");
      break;
    default:
      console.error('Unknown message type: ' + type);
  }
};

ws.onclose = function() {
  bufferedWrite("Terminal disconnected: refresh to reconnect\r\n");
  console.log("Web socket disconnected.");
  ws.close();
};
