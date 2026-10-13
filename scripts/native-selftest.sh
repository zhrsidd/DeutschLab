#!/usr/bin/env bash
# Native self-test of the bundled DeutschLab.app (macOS).
#
# Builds the app, starts it with HOME pointing at a fresh temporary folder and
# DEUTSCHLAB_SELFTEST_OUT set, and prints the report it writes before quitting.
# The self-test uses deutschlab-selftest.db inside that temporary home, so your
# real learning database (~/Library/Application Support/com.deutschlab.app) is
# never opened. No Accessibility or Screen Recording permission is needed; a
# DeutschLab window appears for about ten seconds.

set -euo pipefail
cd "$(dirname "$0")/.."

ISOLATED_HOME="$(mktemp -d "${TMPDIR:-/tmp}/deutschlab-selftest-home.XXXXXX")"
REPORT="$ISOLATED_HOME/selftest-report.json"
APP="src-tauri/target/debug/bundle/macos/DeutschLab.app/Contents/MacOS/deutschlab"

if [ "${SKIP_BUILD:-0}" != "1" ]; then
  npx tauri build --debug --bundles app >"$ISOLATED_HOME/build.log" 2>&1 || {
    echo "Build failed; see $ISOLATED_HOME/build.log"
    exit 1
  }
fi

HOME="$ISOLATED_HOME" DEUTSCHLAB_SELFTEST_OUT="$REPORT" "$APP" >"$ISOLATED_HOME/app.log" 2>&1 &
APP_PID=$!

for _ in $(seq 1 120); do
  [ -f "$REPORT" ] && break
  if ! kill -0 "$APP_PID" 2>/dev/null; then break; fi
  sleep 1
done

kill "$APP_PID" 2>/dev/null || true

if [ ! -f "$REPORT" ]; then
  echo "No report written; see $ISOLATED_HOME/app.log"
  exit 1
fi

python3 - "$REPORT" <<'PY'
import json, sys
report = json.load(open(sys.argv[1]))
for check in report["checks"]:
    print(("PASS " if check["ok"] else "FAIL ") + check["name"])
print("Origin:", report["origin"])
print("All passed:", report["passed"])
sys.exit(0 if report["passed"] else 1)
PY
echo "Report and backups: $ISOLATED_HOME"
