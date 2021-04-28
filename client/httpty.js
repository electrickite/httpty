// HttPty Client
// Requires Chromium hterm: https://chromium.googlesource.com/apps/libapps/+/master/hterm
//

function HttPty(opts) {
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

HttPty.MSG = {
  DATA: '00',
  ERROR: '01',
  ID: '02',
  ALERT: '03',
  RESIZE: '04'
};

HttPty.PROTOCOL = 'httpty';

// Create a terminal emulator
// Start socket connection when terminal is ready
HttPty.prototype.start = function() {
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
HttPty.prototype.end = function() {
  this.ws.close();
};

// Send line of input to tty
HttPty.prototype.input = function(line) {
  this._sendData(line + "\r");
};

// Write line of text to terminal
HttPty.prototype.output = function(str) {
  this.term.io.println(str);
};

// Create web socket and event handlers
HttPty.prototype._createWebSocket = function() {
  var self = this;

  if(typeof WebSocket != 'function') {
    console.error('ReferenceError: WebSocket not defined');
    this.output('Error: Your web browser does not support WebSockets!');
    return;
  }

  this.ws = new WebSocket(this.socketUrl, HttPty.PROTOCOL);

  this.ws.onopen = function() {
    if (self.ws.protocol == HttPty.PROTOCOL) {
      console.log("Web socket connected");
      self._initTerminal();
      self._sendResize(self.term.screenSize.width, self.term.screenSize.height);
      self.output("Terminal connected");
    } else {
      console.error('Unsupported WebSocket subprotocol. Server must support: ' + HttPty.PROTOCOL);
      self.output("Unsupported WebSocket protocol");
      self.ws.close(4000, 'Unsupported protocol');
    }
  };

  this.ws.onmessage = function(event) {
    if (typeof event.data != 'string' || event.data.length < 2) {
      console.error('Malformed message received: ' + event.data);
      return;
    }

    var type = event.data.substring(0, 2);
    var data = event.data.substring(2);

    switch(type) {
      case HttPty.MSG.DATA:
        self.term.io.writeUTF16(data);
        break;
      case HttPty.MSG.ALERT:
        self.output(data);
        break;
      case HttPty.MSG.ID:
        console.log('Client ID: ' + data);
        break;
      case HttPty.MSG.ERROR:
        console.error('ERROR: ' + data);
        self.output('Error: ' + data);
        break;
      default:
        console.error('Unknown message type: ' + type);
    }
  };

  this.ws.onerror = function(err) {
    console.error('WebSocket connection error:');
    console.error(err);
    self.output('WebSocket connection error!');
  };

  this.ws.onclose = function(event) {
    self.output('Terminal disconnected: refresh to reconnect');
    console.log('WebSocket connection closed:');
    console.log(event);
  };
};

// Configure terminal event handlers
HttPty.prototype._initTerminal = function() {
  var io = this.term.io.push();

  io.onVTKeystroke = this._sendData.bind(this);
  io.sendString = this._sendData.bind(this);
  io.onTerminalResize = this._sendResize.bind(this);
};

// Encode and send message over socket
HttPty.prototype._sendMessage = function(msg, type) {
  this.ws.send(type + msg);
};

// Send raw input data to tty over socket
HttPty.prototype._sendData = function(data) {
  this._sendMessage(data, HttPty.MSG.DATA);
};

// Send terminal resize message over socket
HttPty.prototype._sendResize = function(col, row) {
  if (!isNaN(col) && !isNaN(row)) {
    this._sendMessage(col + '|' + row, HttPty.MSG.RESIZE);
  } else {
    return false;
  }
};
