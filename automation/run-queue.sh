#!/bin/bash

# run-queue.sh
# Processes tasks from queue/ one at a time.
# Moves files through: queue/ → running/ → done/ or failed/
#
# Usage:
#   bash .ai-global/automation/run-queue.sh
#
# Run from your project root (outside any Claude session).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
QUEUE_DIR="$SCRIPT_DIR/queue"
RUNNING_DIR="$SCRIPT_DIR/running"
DONE_DIR="$SCRIPT_DIR/done"
FAILED_DIR="$SCRIPT_DIR/failed"
LOG_DIR="$SCRIPT_DIR/logs"

mkdir -p "$QUEUE_DIR" "$RUNNING_DIR" "$DONE_DIR" "$FAILED_DIR" "$LOG_DIR"

# ─────────────────────────────────────────
# Guard: bail if something is already running
# ─────────────────────────────────────────
RUNNING_COUNT=$(ls -1 "$RUNNING_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$RUNNING_COUNT" -gt 0 ]; then
  RUNNING_FILE=$(ls -1 "$RUNNING_DIR"/*.md | head -1)
  echo "⚠️  Already running: $(basename $RUNNING_FILE)"
  echo "   If this is stale, manually move it out of running/ and re-run."
  exit 1
fi

# ─────────────────────────────────────────
# Check queue
# ─────────────────────────────────────────
QUEUE_COUNT=$(ls -1 "$QUEUE_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
if [ "$QUEUE_COUNT" -eq 0 ]; then
  echo "✅ Queue is empty. Nothing to run."
  exit 0
fi

echo "📋 Queue: $QUEUE_COUNT task(s) waiting"
echo ""

# ─────────────────────────────────────────
# Process queue (one at a time, in order)
# ─────────────────────────────────────────
for TASK_FILE in "$QUEUE_DIR"/*.md; do
  [ -f "$TASK_FILE" ] || continue

  FILENAME=$(basename "$TASK_FILE")
  TASKNAME="${FILENAME%.md}"
  TIMESTAMP=$(date +%Y%m%d-%H%M%S)
  LOG_FILE="$LOG_DIR/${TASKNAME}-${TIMESTAMP}.log"

  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "🚀 Starting: $FILENAME"
  echo "   Log: $LOG_FILE"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""

  # Move to running/ (lock)
  mv "$TASK_FILE" "$RUNNING_DIR/$FILENAME"

  # Log header
  {
    echo "Task: $TASKNAME"
    echo "Started: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    cat "$RUNNING_DIR/$FILENAME"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Output:"
    echo ""
  } >> "$LOG_FILE"

  # Run Claude
  PROMPT=$(cat "$RUNNING_DIR/$FILENAME")
  OUTPUT=$(claude -p "$PROMPT" --allowedTools Read,Glob,Grep,Bash,Write,Edit 2>&1)
  EXIT_CODE=$?

  # Log output
  echo "$OUTPUT" >> "$LOG_FILE"
  echo "" >> "$LOG_FILE"

  # Capture git diff
  DIFF=$(git diff --no-color 2>/dev/null)
  if [ -n "$DIFF" ]; then
    echo "📝 Git diff:" >> "$LOG_FILE"
    echo "$DIFF" >> "$LOG_FILE"
    echo "" >> "$LOG_FILE"
  fi

  # ─────────────────────────────────────────
  # Outcome
  # ─────────────────────────────────────────
  if [ "$EXIT_CODE" -eq 0 ]; then
    echo "✅ $FILENAME completed successfully"
    echo "Completed: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"
    mv "$RUNNING_DIR/$FILENAME" "$DONE_DIR/${TASKNAME}-${TIMESTAMP}.md"
  else
    echo "❌ $FILENAME failed (exit code $EXIT_CODE)"
    echo "Failed: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$LOG_FILE"
    echo "Exit code: $EXIT_CODE" >> "$LOG_FILE"
    mv "$RUNNING_DIR/$FILENAME" "$FAILED_DIR/${TASKNAME}-${TIMESTAMP}.md"
    echo ""
    echo "⛔ Stopping queue. Fix the failed task before continuing."
    echo "   Failed file: $FAILED_DIR/${TASKNAME}-${TIMESTAMP}.md"
    echo "   Log: $LOG_FILE"
    exit 1
  fi

  echo ""
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Queue complete. All tasks processed."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
