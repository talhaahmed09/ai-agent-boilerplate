#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash).
# Fires before every Bash command. It only acts when the command is a git commit
# (or push); for everything else it exits 0 immediately and stays out of the way.
#
# On a commit it runs the type and test gates in each present repo:
#   - tsc --noEmit  (types must pass)
#   - jest          (tests must pass)
# Exit 2 blocks the commit and shows the reason to the agent.
set -uo pipefail

CMD="$(cat | python3 -c 'import sys,json; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null)"

# Only gate commits/pushes. Let all other bash through untouched.
case "$CMD" in
  *"git commit"*|*"git push"*) ;;
  *) exit 0 ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
fail=0

run_gate() {
  repo="$1"
  [ -d "$ROOT/$repo" ] || return 0
  [ -f "$ROOT/$repo/package.json" ] || return 0
  cd "$ROOT/$repo" || return 0

  if [ -f tsconfig.json ] && [ -f node_modules/.bin/tsc ]; then
    if ! npx --no-install tsc --noEmit >/tmp/tsc.$repo.out 2>&1; then
      echo "[$repo] Type check failed (tsc --noEmit):" >&2
      tail -n 30 /tmp/tsc.$repo.out >&2
      fail=1
    fi
  fi

  if [ -f node_modules/.bin/jest ]; then
    if ! npx --no-install jest --passWithNoTests >/tmp/jest.$repo.out 2>&1; then
      echo "[$repo] Tests failed (jest):" >&2
      tail -n 30 /tmp/jest.$repo.out >&2
      fail=1
    fi
  fi
}

run_gate frontend
run_gate backend

if [ "$fail" -ne 0 ]; then
  echo "" >&2
  echo "Commit blocked: fix the type/test failures above, then commit again." >&2
  exit 2
fi

exit 0
