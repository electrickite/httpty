Htty
====

Htty (HTTP tty) provides a browser-based terminal emulator that connects to a
pseudo tty (pty) interface on the host via WebSockets.

# Requirements

A Unix-like operating system. Htty may work on other systems, but has not been
tested. In addition, the following software is required:

  * [Node.js][1] v10+
  * [Python][2] 2.7
  * [make][3]
  * [GCC][4] or other C/C++ compiler

# Installation

Change to the project directory and install NPM dependencies:

    $ cd htty
    $ npm install

## Configuration

If needed, create a local configuration file to override the default settings:

    $ cp config/default.json config/local.json
    $ vi config/local.json

The following configuration options are available:

    {
      "timestamps": true,              Add timestamps to console messages
      "server": {
        "user": "myuser",              The user for the server process (optional)
        "group": "mygroup",            The group for the server process (optional)
        "port": 3000,                  HTTP server port
        "cert": "/path/to/cert.pem",   Path to TLS certificate
        "key": "/path/to/key.pem"      Path to TLS private key
      },
      "client": {
        "command": "/bin/sh",          Path to executable command for pty
        "args": [],                    Array of arguments to pass to command
        "connections": 10,             Connection limit
        "ping": 60,                    Socket ping interval in seconds (0 disables pings)
        "motd": "Hello, world!"        Message of the day to display on connect
      }
    }

## Service

Htty can be run as a systemd service. An example unit file is included. It can
be installed with:

    # cp htty.service /etc/systemd/system
    # systemctl daemon-reload
    # systemctl start htty.service

The application can (optionally) change its effective user and group after
binding to a port. The `user` and `group` configuration settings control this
behavior, and can accept either a user/group name or an ID.

# Use

Start the web server:

    $ node server.js

And open the web terminal in a browser at [http://localhost:3000/](http://localhost:3000/)

# Copyright and License

Copyright 2018 Corey Hinshaw

Htty is made available under the terms of the MIT license, the full text of
which can be found in the LICENSE file.


[1]: https://nodejs.org/en/
[2]: https://www.python.org
[3]: https://www.gnu.org/software/make/
[4]: https://gcc.gnu.org
