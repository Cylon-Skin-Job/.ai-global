# Automation Framework

Universal pipeline and task automation for Claude instances across all projects.

## Overview

This framework enables:
- **Parallel execution** — Background Claude instance runs tasks while you continue in IDE
- **Status tracking** — Via STATUS.md bulletin in each project
- **Automatic handoff** — Task scopes written to STATUS.md, launcher executes autonomously
- **Safe execution** — Validation gates, checkpoints, automatic rollback on failure
- **Cross-project consistency** — Same patterns in Raven OS, Fusion Vault, exjw-librarian, etc.

## Structure

```
automation/
├── README.md (this file)
├── pipeline.json              # Task processing pipeline definition
├── launcher.mjs               # Spawns background Claude instance
├── executor.mjs               # Runs tasks from STATUS.md
├── validators/                # Safety validation rules
│   ├── schema.json            # Task schema validation
│   └── safety-checks.mjs      # Pre-execution checks
└── templates/
    ├── task-template.md       # Template for scoping tasks
    └── phase-template.md      # Template for multi-phase work
```

## Quick Start: Launch a Task

### 1. Write Task Scope to STATUS.md

In your project's `.ai-project/bulletin/STATUS.md`:

```markdown
## TASK: Phase 3 — Automated Cloud Scraper
**Objective:** Implement scraper state machine with Cloud Scheduler
**Status:** READY FOR EXECUTION
**Assigned to:** Background Claude instance
**Created:** 2026-02-17

### What Needs to Be Built
[detailed scope...]

### Success Metrics
- ✅ Scraper runs autonomously
- ✅ 1,400+ articles/day
- ✅ Auto-retry on failure
```

### 2. Invoke the Launcher

From your terminal:

```bash
cd your-project
node .ai-global/automation/launcher.mjs --task "Phase 3 — Automated Cloud Scraper"
```

The launcher will:
1. ✅ Parse your STATUS.md
2. ✅ Find the task matching "Phase 3"
3. ✅ Validate it's READY FOR EXECUTION
4. ✅ Spawn background Claude instance
5. ✅ Return immediately (non-blocking)

### 3. Monitor Progress

```bash
# Check git log for commits
git log --oneline | head -20

# Read STATUS.md for updates
cat .ai-project/bulletin/STATUS.md

# Watch the background instance
tail -f .ai-project/logs/background-claude.log
```

## Task Schema

Every task in STATUS.md must have:

```markdown
## TASK: [Name]
**Objective:** [One-sentence goal]
**Status:** READY FOR EXECUTION | IN PROGRESS | BLOCKED | COMPLETE
**Assigned to:** Background Claude instance
**Created:** [ISO date]

### Overview
[Context and what exists now]

### What Needs to Be Built
[Detailed breakdown of requirements]

### Files to Create/Modify
[Explicit list]

### Implementation Checklist
[Checkpoints for verification]

### Success Metrics
[How to know it worked]

### Blockers / Unknowns
[Known issues to watch for]
```

## How It Works

### Pipeline Flow

```
1. STATUS.md (task scope)
   ↓
2. Launcher parses & validates
   ↓
3. Background Claude spawned
   ↓
4. Task execution loop:
   - Create checkpoint (git)
   - Gather context (docs, rules)
   - Execute step
   - Validate output
   - On failure: retry (3x) or mark BLOCKED
   - Commit success
   ↓
5. Update STATUS.md with results
   ↓
6. Broadcast completion
```

### Git Discipline

Background Claude commits at each step:
- `checkpoint: before [step]` — Safe point to rollback to
- `complete: [step]` — Step finished successfully
- `skip: [step] - [reason]` — Intentional skip with reason
- `blocked: [step] - [reason]` — Hit a blocker, stopped here

This gives you full visibility and ability to resume.

### Safety Gates

Before execution, launcher validates:
- ✅ Task status is READY FOR EXECUTION
- ✅ Task has all required fields
- ✅ Objective is clear and measurable
- ✅ Success metrics defined
- ✅ No conflicting background instances running

During execution:
- ✅ Pre-commit hooks validate changes
- ✅ File modifications stay within scoped paths
- ✅ No destructive operations without explicit approval
- ✅ All commits atomic and reversible

## Advanced: Multi-Phase Work

For complex projects like Fusion Vault (7 phases):

```markdown
## TASK: Phases 3-6 Pipeline
**Objective:** Implement scraper → enrichment → search → Raven OS integration
**Status:** READY FOR EXECUTION
**Phases:** 3 phases, sequential with validation between each

### Phase 3: Automated Scraper
[scope...]
**Status: READY** ← Launcher starts here

### Phase 4: Enrichment Pipeline
[scope...]
**Status: WAITING** ← Blocked until Phase 3 complete

### Phase 5: Search API
[scope...]
**Status: WAITING** ← Blocked until Phase 4 complete

### Success Metrics
- Phase 3: 1,400+ articles/day
- Phase 4: 2,000+ articles enriched
- Phase 5: Search API returns results
```

Launcher will:
1. Execute Phase 3
2. Validate completion
3. Unlock Phase 4
4. Execute Phase 4
5. Validate completion
6. Unlock Phase 5
7. Execute Phase 5
8. Return results

## Custom Validators

To add safety checks for your project, create `.ai-project/validators/custom.mjs`:

```javascript
export async function validateFusion Vault(task, context) {
  // Reject if trying to modify production Firebase directly
  if (task.description.includes('DELETE') && !task.hasOwnProperty('confirmDelete')) {
    throw new Error('Destructive operation requires confirmDelete: true');
  }
  
  return { valid: true };
}
```

## Environment Variables

Background Claude uses:
- `CLAUDE_PROJECT_ROOT` — Your project directory
- `CLAUDE_TASK_NAME` — Name of task being executed
- `CLAUDE_INSTANCE_ID` — Unique ID for this execution
- `CLAUDE_LOG_FILE` — Where to write logs

Set via `.env` or terminal before launching.

## Troubleshooting

### "Task not found"
```bash
# Check task name matches STATUS.md exactly
grep "## TASK:" .ai-project/bulletin/STATUS.md
```

### "Status is not READY FOR EXECUTION"
```bash
# Update STATUS.md before launching
# Launcher won't run tasks that aren't explicitly ready
```

### "Background instance crashed"
```bash
# Check logs
cat .ai-project/logs/background-claude.log

# Check git status
git log --oneline -10
git status

# Manually resume if possible
git checkout [last-good-commit]
```

### "Multiple instances running"
```bash
# Only one background instance per project at a time
ps aux | grep claude
# Kill conflicting instance if needed
kill -9 [pid]
```

## Future Enhancements

- [ ] Web UI for task management (Raven OS panel)
- [ ] Task prioritization and queueing
- [ ] Distributed execution (multiple instances in parallel)
- [ ] Automatic email summaries on completion
- [ ] Integration with GitHub Actions for CI/CD
- [ ] Webhook notifications (Slack, Discord)

---

**Last updated:** 2026-02-17
