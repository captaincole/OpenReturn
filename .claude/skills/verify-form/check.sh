#!/usr/bin/env bash
# Every gate a form change must pass, from the repo root: .claude/skills/verify-form/check.sh <form>
set -euo pipefail
form="${1:?usage: check.sh <federal/<short> | state/<st>/<short>>}"
cd "$(git rev-parse --show-toplevel)"

step() { printf '\n== %s\n' "$*"; "$@"; }
step npm run -s typecheck
step npm run -s lint
step npm run -s test:unit
step npm run -s test:integration
step npm test
step npm run -s form-engine -- form-status "$form"
