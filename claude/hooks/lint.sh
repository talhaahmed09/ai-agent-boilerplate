#!/usr/bin/env bash
# PostToolUse hook (matcher: Write|Edit).
# Formats and lints the file that was just edited, in whichever repo it lives in.
# - Auto-fixes with Prettier + ESLint.
# - Exit 0  -> allow (also used when there's nothing to lint yet).
# - Exit 2  -> block: ESLint found errors it could not auto-fix. The message on
#              stderr is shown to the agent so it can fix them.
set -uo pipefail

# The hook receives JSON on stdin; pull out the edited file path.
FILE="$(cat | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("file_path",""))' 2>/dev/null)"

# Nothing to do for non-JS/TS files (e.g. markdown specs).
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac
[ -f "$FILE" ] || exit 0

# Find the nearest package.json above the file = the repo root for this file.
dir="$(dirname "$FILE")"
pkg_root=""
while [ "$dir" != "/" ] && [ -n "$dir" ]; do
  if [ -f "$dir/package.json" ]; then pkg_root="$dir"; break; fi
  dir="$(dirname "$dir")"
done
# No package.json yet (repo not scaffolded) -> nothing to lint.
[ -n "$pkg_root" ] || exit 0

cd "$pkg_root" || exit 0

# Format (best-effort; never blocks).
if [ -f node_modules/.bin/prettier ]; then
  npx --no-install prettier --write "$FILE" >/dev/null 2>&1 || true
fi

# Lint with auto-fix; block only if real errors remain.
if [ -f node_modules/.bin/eslint ]; then
  if ! npx --no-install eslint --fix "$FILE" >/tmp/eslint.out 2>&1; then
    echo "ESLint found problems in $FILE that could not be auto-fixed:" >&2
    cat /tmp/eslint.out >&2
    exit 2
  fi
fi

exit 0
