const util = require('util');

exports.add = function() {
  ['log', 'warn', 'error'].forEach(function(method) {
    var oldMethod = console[method].bind(console);
    console[method] = function() {
      arguments[0] = util.format('%s [%s] %s', new Date().toISOString(), method.toUpperCase(), arguments[0]);
      oldMethod.apply(console, Array.from(arguments));
    };
  });
};
