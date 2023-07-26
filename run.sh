#! /bin/sh
# shellcheck disable=SC2155,SC2088
export HOME="$(pwd)"
export INPUT_VERSION=4.11.1
export INPUT_DEST='~/pnpm.temp'
export INPUT_RUN_INSTALL=null
export INPUT_NODEJS_BUNDLED=false
exec node dist/index.js
