#! /bin/sh
# shellcheck disable=SC2155,SC2088
export HOME="$(pwd)"
export INPUT_VERSION=4.11.1
export INPUT_DEST='~/pnpm.temp'
export INPUT_BIN_DEST='~/pnpm.temp/.bin'
export INPUT_REGISTRY=https://registry.npmjs.com
export INPUT_RUN_INSTALL=null
exec node dist/index.js
