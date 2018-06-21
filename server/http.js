const fs = require('fs');
const http = require('http');
const https = require('https');

module.exports = function(app, opts) {
  opts = Object.assign({port: 3000}, opts);
  var server;

  if (opts.key && opts.cert) {
    server = https.createServer({
      key: fs.readFileSync(opts.key),
      cert: fs.readFileSync(opts.cert)
    }, app);
  } else {
    server = http.createServer(app);
  }

  server.listen(opts.port, function() {
    // Switch process UIG/GID after port binding
    if (opts.group) { process.setgid(opts.group); }
    if (opts.user) { process.setuid(opts.user); }
    console.log('HTTP server listening on port %s', opts.port);
    console.log('Process UID=%s  GID=%s', process.getuid(), process.getgid());
  });

  return server;
};
