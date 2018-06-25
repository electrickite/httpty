HttPty
======

HttPty (HTTP pty) enables connections to pseudo tty (pty) interfaces on the host
system via WebSockets. It also provides a browser-based terminal emulator and
client implementation.

# Requirements

A Unix-like operating system. HttPty may work on other systems, but has not been
tested. In addition, the following software is required:

  * [Node.js][1] v10+
  * [Python][2] 2.7
  * [make][3]
  * [GCC][4] or other C/C++ compiler

# Installation

Change to the project directory and install NPM dependencies:

    $ cd httpty
    $ npm install

## Configuration

If needed, create a [TOML][5] configuration file to override the default
settings:

    $ cp config/default.toml config/local.toml
    $ vi config/local.toml

See `config/default.toml` for the complete list of configuration options.

### Environment variables

Setting the `NODE_ENV` environment variable will cause a corresponding
configuration file to be read. Eg, `NODE_ENV=production` will load
`config/production.toml`.

Configuration options will also be read from the environment. See
`config/custom-environment-variables.toml` for the list of available
environment variables. Ex:

    PORT=8000 CMD_PATH=/bin/zsh node server.js

## Service

HttPty can be run as a systemd service. An example unit file is included. It can
be installed with:

    # cp httpty.service /etc/systemd/system
    # systemctl daemon-reload
    # systemctl start httpty.service

The application can (optionally) change its effective user and group after
binding to a port. The `user` and `group` configuration settings control this
behavior, and can accept either a user/group name or an ID.

## Use

Start the web server:

    $ node server.js

And open the web terminal in a browser at [http://localhost:3000/](http://localhost:3000/)

# WebSocket subprotocol

HttPty communicates using WebSockets via a simple subprotocol called`httpty`.
The HttPty server will only respond with a `Sec-WebSocket-Protocol` header for
this subprotocol.

Messages are sent as UTF-8 encoded text with the following format:

    (MESSAGE_TYPE)(MESSAGE_TEXT)

Where `(MESSAGE_TYPE)` is a two character message type identifer and
`(MESSAGE_TEXT)` is the data to be communicated.

The message types are:

  * `00` Data: text sent to or received from the pty interface
  * `01` Error: indicates an error has occurred, message text contains the error message
  * `02` ID: Message text contains the client ID as assigned by the HttPty server
  * `03` Alert: Message text contains an out-of-band notice or alert
  * `04` Resize: Trigger terminal resize. Message text format: `COLUMNS|ROWS`

The server responds to message types 00, 01, and 04. Clients can receive 00, 01,
02, and 03.

A JavaScript client implementation is included with the HttPty server project in
`client/httpty.js`.

# Copyright and License

Copyright 2018 Corey Hinshaw

HttPty is made available under the terms of the MIT license, the full text of
which can be found in the LICENSE file.


[1]: https://nodejs.org/en/
[2]: https://www.python.org
[3]: https://www.gnu.org/software/make/
[4]: https://gcc.gnu.org
[5]: https://github.com/toml-lang/toml
