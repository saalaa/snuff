#!/usr/bin/env node

var commander = require('commander');
var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var tls = require('tls');

function init() {
  shell.exec('mkdir -p ~/.snuff');

  shell.exec(
    'openssl genrsa -out ~/.snuff/key.pem 2048'
  );

  shell.exec(
    'openssl req -new -sha256 -key ~/.snuff/key.pem -out ' +
      '~/.snuff/csr.pem -subj /C=AB/ST=Cdef/L=Ghij/O=Klmn/OU=Opqr/CN=stuvw.xyz'
  );

  shell.exec(
    'openssl x509 -req -in ~/.snuff/csr.pem -signkey ' +
      '~/.snuff/key.pem -out ~/.snuff/cert.pem'
  );
}

function server(host, port) {
  var key = path.join(process.env.HOME, '.snuff/key.pem');
  var cert = path.join(process.env.HOME, '.snuff/cert.pem');

  var options = {
    key: fs.readFileSync(key),
    cert: fs.readFileSync(cert)
  };

  function handler(conn) {
    var self = this;

    process.stdin.pipe(conn);
    process.stdin.resume();

    conn.pipe(
      process.stdout
    );

    conn.on('end', function () {
      self.close();
    });
  }

  tls.createServer(options, handler)
    .listen(port, host);
}

function client(host, port) {
  var options = {
    host: host,
    port: port,

    rejectUnauthorized: false
  };

  function handler() {
    process.stdin.pipe(this);
    process.stdin.resume();

    this.pipe(
      process.stdout
    );
  }

  tls.connect(options, handler);
}

commander
  .option('-i, --initialize', 'initialize TLS/SSL')
  .option('-l, --listen', 'listen on host and port')
  .option('-h, --host <host>', 'host or IP address')
  .option('-p, --port <port>', 'port number', '9000')
  .parse(process.argv);

if (commander.initialize) {
  init();
}
else {
  var host = commander.host;
  var port = commander.port;

  if (commander.listen) {
    server(host || '0.0.0.0', port);
  }
  else {
    client(host || 'localhost', port);
  }
}
