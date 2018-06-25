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

If needed, create a [TOML][5] configuration file to override the default
settings:

    $ cp config/default.toml config/local.toml
    $ vi config/local.toml

See `config/default.toml` for the complete list of configuration options.

### Environment variables

Setting the `NODE_ENV` environment variable will cause an additional
configuration file to be read. Eg, `NODE_ENV=production` will load
`config/production.toml`.

Configuration options will also be read from the environment. See
`config/custom-environment-variables.toml` for the list of available
environment variables. Ex:

    PORT=8000 CMD_PATH=/bin/zsh node server.js

## Service

Htty can be run as a systemd service. An example unit file is included. It can
be installed with:

    # cp htty.service /etc/systemd/system
    # systemctl daemon-reload
    # systemctl start htty.service

The application can (optionally) change its effective user and group after
binding to a port. The `user` and `group` configuration settings control this
behavior, and can accept either a user/group name or an ID.

## Use

Start the web server:

    $ node server.js

And open the web terminal in a browser at [http://localhost:3000/](http://localhost:3000/)

# Message protocol

Htty communicates over a web socket connection using a simple protocol.

Web socket messages are sent as UTF-8 encoded strings with the following
format:

    (MESSAGE_TYPE)(MESSAGE_DATA)

Where `(MESSAGE_TYPE)` is a two character message type identifer and
`(MESSAGE_DATA)` is the data to be communicated.

The message types are:

  * `00` Data: text sent to or received from the tty interface
  * `01` Error: indicates an error has occurred, message data contains the error message
  * `02` ID: Message data contains the client ID number as assigned by the Htty server
  * `03` Alert: Message data contains a notice or alert
  * `04` Resize: Trigger terminal resize. Message data format: `COLUMNS|ROWS`

A JavaScript client implementation is included with the Htty server project in
`client/htty.js`.

# Copyright and License

Copyright 2018 Corey Hinshaw

Htty is made available under the terms of the MIT license, the full text of
which can be found in the LICENSE file.


[1]: https://nodejs.org/en/
[2]: https://www.python.org
[3]: https://www.gnu.org/software/make/
[4]: https://gcc.gnu.org
[5]: https://github.com/toml-lang/toml
