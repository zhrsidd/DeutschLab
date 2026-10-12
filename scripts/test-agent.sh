#!/usr/bin/env bash

# DeutschLab agent-friendly test runner.
# Runs the full validation gate while keeping successful output out of
# Claude's context. Full output is saved to a temporary log.

set -u
set -o pipefail

PROJECT_NAME="deutschlab"
LOG_DIR="${TMPDIR:-/tmp}/${PROJECT_NAME}-test-logs"

mkdir -p "$LOG_DIR"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
LOG_FILE="${LOG_DIR}/test-all-${TIMESTAMP}.log"

echo "Running DeutschLab full test gate..."
echo "Full output → ${LOG_FILE}"
echo

npm run test:all >"$LOG_FILE" 2>&1
STATUS=$?

if [ "$STATUS" -eq 0 ]; then
  echo "✓ npm run test:all passed"
  echo

  # Print only useful summary lines from successful runs.
  grep -E \
    "Test Files|Tests |tests? passed|passed \(|failed|built in|Build completed|Running [0-9]+ tests|[0-9]+ passed|[0-9]+ failed" \
    "$LOG_FILE" \
    | tail -n 30 || true

  echo
  echo "Full log retained at:"
  echo "$LOG_FILE"
else
  echo "✗ npm run test:all failed with exit code $STATUS"
  echo
  echo "Last 160 lines:"
  echo "------------------------------------------------------------"
  tail -n 160 "$LOG_FILE"
  echo "------------------------------------------------------------"
  echo
  echo "Full failure log:"
  echo "$LOG_FILE"
fi

exit "$STATUS"
