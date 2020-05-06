#!/bin/sh
# FreeBSD rc.d service script

# PROVIDE: httpty
# REQUIRE: DAEMON
# KEYWORD: shutdown

. /etc/rc.subr

name="httpty"
desc="HTTP pseudo tty terminal"
rcvar="httpty_enable"

load_rc_config $name
: ${httpty_enable:=NO}
: ${httpty_env="NODE_ENV=production"}
: ${httpty_chdir="/usr/local/httpty"}
: ${httpty_flags="-r -S -s info -l daemon -T $name"}

pidfile="/var/run/${name}.pid"
command="/usr/sbin/daemon"
command_args='-P "${pidfile}" /usr/local/bin/node server.js'

run_rc_command "$1"
