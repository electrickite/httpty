// Htty Web Terminal
//

function Htty(opts) {
  opts = opts || {};

  this.term = null;
  this.ws = null;
  this.elementId = opts.elementId || 'terminal';

  if (opts.socketUrl) {
    this.socketUrl = opts.socketUrl;
  } else {
    var protocolPrefix = (window.location.protocol === 'https:') ? 'wss:' : 'ws:';
    this.socketUrl = protocolPrefix + '//' + location.host + '/ws';
  }
}

Htty.MSG = {
  DATA: '00',
  ERROR: '01',
  ID: '02',
  ALERT: '03',
  RESIZE: '04'
};

// Create a terminal emulator
// Start socket connection when terminal is ready
Htty.prototype.start = function() {
  hterm.defaultStorage = new lib.Storage.Local();

  this.term = new hterm.Terminal();
  this.term.onTerminalReady = this._createWebSocket.bind(this);

  this.term.decorate(document.getElementById(this.elementId));
  this.term.installKeyboard();
  this.term.setCursorPosition(0, 0);
  this.term.setCursorVisible(true);

  this.term.prefs_.set('ctrl-c-copy', true);
  this.term.prefs_.set('ctrl-v-paste', true);
  this.term.prefs_.set('use-default-window-copy', true);
  this.term.prefs_.set('enable-dec12', true);
  this.term.prefs_.set('cursor-blink', true);
};

// Close the connection
Htty.prototype.end = function() {
  this.ws.close();
};

// Send line of input to tty
Htty.prototype.input = function(line) {
  this._sendData(line + "\r");
};

// Write line of text to terminal
Htty.prototype.output = function(str) {
  this.term.io.println(str);
};

// Create web socket and event hanlers
Htty.prototype._createWebSocket = function() {
  var self = this;

  if(typeof WebSocket != 'function') {
    console.error('ReferenceError: WebSocket not defined');
    this.output('Error: Your web browser does not support WebSockets!');
    return;
  }

  this.ws = new WebSocket(this.socketUrl);

  this.ws.onopen = function() {
    console.log("Web socket connected");
    self._initTerminal();
    self._sendResize(self.term.screenSize.width, self.term.screenSize.height);
    self.output("Terminal connected");
  };

  this.ws.onmessage = function(event) {
    if (typeof event.data != 'string' || event.data.length < 2) {
      console.error('Malformed message received: ' + event.data);
      return;
    }

    var type = event.data.substring(0, 2);
    var data = event.data.substring(2);

    switch(type) {
      case Htty.MSG.DATA:
        self.term.io.writeUTF16(data);
        break;
      case Htty.MSG.ALERT:
        self.output(data);
        break;
      case Htty.MSG.ID:
        console.log('Client ID: ' + data);
        break;
      case Htty.MSG.ERROR:
        console.error('ERROR: ' + data);
        self.output(data);
        break;
      default:
        console.error('Unknown message type: ' + type);
    }
  };

  this.ws.onerror = function(err) {
    console.error('Web socket connection error:');
    console.error(err);
    self.output('Socket error!');
    self.ws.close();
  };

  this.ws.onclose = function() {
    self.output("Terminal disconnected: refresh to reconnect");
    console.log("Web socket disconnected."); 
    self.ws.close();
  };
};

// Configure terminal event handlers
Htty.prototype._initTerminal = function() {
  var io = this.term.io.push();

  io.onVTKeystroke = this._sendData.bind(this);
  io.sendString = this._sendData.bind(this);
  io.onTerminalResize = this._sendResize.bind(this);
};

// Encode and send message over socket
Htty.prototype._sendMessage = function(msg, type) {
  this.ws.send(type + msg);
};

// Send raw input data to tty over socket
Htty.prototype._sendData = function(data) {
  this._sendMessage(data, Htty.MSG.DATA);
};

// Send terminal resize message over socket
Htty.prototype._sendResize = function(col, row) {
  this._sendMessage(col + '|' + row, Htty.MSG.RESIZE);
};
