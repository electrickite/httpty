const events = require('events');
const pty = require('node-pty');
const uuid = require('uuid/v4');

function noop() {}


function Client(ws) {
  let self = this;

  this.socket = ws;
  this.term = null;
  this.id = uuid();
  this.socket.isAlive = true;

  console.log('CID=%s CONNECTED', this.id);
  this.sendMessage(this.id, Client.MSG.ID);

  this.socket.on('message', this.receiveMessage.bind(this));

  this.socket.on('close', function() {
    console.log('CID=%s DISCONNECTED', self.id);
    self.socket = null;
    self.disconnect();
  });

  this.socket.on('pong', function() {
    this.isAlive = true;
  });

  events.EventEmitter.call(this);
}

Client.prototype.__proto__ = events.EventEmitter.prototype;

Client.MSG = {
  DATA: '00',
  ERROR: '01',
  ID: '02',
  ALERT: '03',
  RESIZE: '04'
};

Client.prototype.startTty = function(cmd = '/bin/sh', args = []) {
  if (this.term) { return; }
  let self = this;

  this.term = pty.spawn(cmd, args, {
    name: 'xterm-256color',
    cols: 80,
    rows: 30
  });
  console.log("PID=%s CREATED for CID=%socket", this.term.pid, this.id);

  this.term.on('data', this.output.bind(this));

  this.term.on('exit', function(code) {
    console.log("PID=%s EXITED", self.term.pid);
    self.term = null;
    self.disconnect();
  });
};

Client.prototype.output = function(data) {
  this.sendMessage(data, Client.MSG.DATA);
};

Client.prototype.alert = function(alert) {
  this.sendMessage(alert, Client.MSG.ALERT);
};

Client.prototype.error = function(msg) {
  this.sendMessage(msg, Client.MSG.ERROR);
};

Client.prototype.input = function(data) {
  if (this.term._writable) {
    this.term.write(data);
  }
};

Client.prototype.sendMessage = function(message, type) {
  this.socket.send(type + message);
};

Client.prototype.receiveMessage = function(message) {
  if (typeof message != 'string' || message.length < 2) {
    this.error('Malformed message received');
    return;
  }

  let type = message.substring(0, 2);
  let data = message.substring(2);

  switch(type) {
    case Client.MSG.DATA:
      this.input(data);
      break;
    case Client.MSG.RESIZE:
      let size = data.split('|');
      if (this.term._writable && size.length == 2) {
        this.term.resize(parseInt(size[0]), parseInt(size[1]));
      }
      break;
    default:
      this.error('Unknown message type: ' + type);
  }
};

Client.prototype.ping = function() {
  if (this.socket.isAlive === false) {
    console.log('CID=%s TERMINATE - Failed to respond to ping', this.id);
    return this.socket.terminate();
  }

  this.socket.isAlive = false;
  this.socket.ping(noop);
};

Client.prototype.disconnect = function() {
  if (this.socket) { this.socket.close(); }
  if (this.term) { this.term.end(); }
  this.emit('disconnected');
  this.removeAllListeners('disconnected');
};

module.exports = Client;
