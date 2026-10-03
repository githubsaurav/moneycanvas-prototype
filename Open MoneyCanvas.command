#!/bin/zsh
cd -- "$(dirname -- "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
if ! command -v node >/dev/null; then
  echo 'MoneyCanvas needs Node.js 20 or newer. Install it, then open this file again.'
  read -k 1
  exit 1
fi
node scripts/launch.mjs
