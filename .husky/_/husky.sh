#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug() {
    [ "$HUSKY_DEBUG" = "1" ] && echo "husky (debug) - $*"
  }
  readonly hook_name="$(basename "$0")"
  debug "starting $hook_name..."
  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi
  readonly husky_dir="$(dirname "$(dirname "$0")")"
  readonly husky_run="$husky_dir/node_modules/husky/run"
  if [ ! -f "$husky_run" ]; then
    echo "can't find husky/run"
    exit 0
  fi
  "$husky_run" "$hook_name" "$husky_dir" "$@"
fi
