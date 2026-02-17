# Universal AI Context (.ai-global)

Shared infrastructure for Claude Code projects: architecture specs, automation framework, and universal rules.

## Structure

```
.ai-global/
├── README.md (this file)
├── UNIVERSAL_DESIGN_SPEC.md (legacy, see documentation/ folder)
├── automation/                           ← New: Background Claude launcher
│   ├── README.md                         ← Start here for automation docs
│   ├── launcher.mjs                      ← Spawns background instances
│   ├── pipeline.json                     ← Task execution pipeline definition
│   └── templates/
│       ├── task-template.md              ← Use this to scope new tasks
│       └── phase-template.md             ← For multi-phase work
└── documentation/                        ← Architecture specs & guides
    ├── UNIVERSAL_DESIGN_SPEC.md          ← 7-layer architecture (all projects)
    └── [other docs]
```

## Quick Start

### For New Projects

Add as git submodule:
```bash
cd your-project
git submodule add /Users/rccurtrightjr./Documents/GitHub/.ai-global .ai-global
git commit -m "chore: add universal AI context (.ai-global) as submodule"
```

### For Background Automation

1. **Scope your task** in `.ai-project/bulletin/STATUS.md` using `automation/templates/task-template.md`
2. **Mark it READY FOR EXECUTION**
3. **Launch the background instance:**
   ```bash
   node .ai-global/automation/launcher.mjs --task "Your Task Name"
   ```
4. **Continue working** — background Claude runs autonomously
5. **Check progress** — `git log`, `cat STATUS.md`, `tail -f logs/*.log`

See `automation/README.md` for full documentation.

### For Architecture Guidance

Read `documentation/UNIVERSAL_DESIGN_SPEC.md` for:
- 7-layer architecture (view, controller, service, state, etc.)
- Component patterns
- CSS token system
- Naming conventions
- Anti-patterns to avoid

## Projects Using This

- **Fusion Vault** — Research library with Cloud Functions & Firestore
- **Raven OS** — Chat interface with universal architecture
- **exjw-librarian** — CLI tool for scraping & analysis (historical)

## Maintaining

This repository contains universal patterns that should be consistent across all projects. To update:

1. Make changes in this repo
2. Test in a project that uses it
3. Commit and push
4. Projects will pull updates via `git submodule update`

## Key Features

✅ **Universal architecture** — All projects follow the same 7-layer pattern
✅ **Shared rules** — Consistent code style, conventions, anti-patterns
✅ **Automation framework** — Launch background Claude with automatic status tracking
✅ **Checkpoints & safety** — Git-backed task execution with rollback capability
✅ **Easy handoff** — Write task scope, launch background instance, continue in parallel

## Next Steps

1. Review `automation/README.md` for how to use the launcher
2. Copy `automation/templates/task-template.md` to your project's STATUS.md
3. Mark a task as **READY FOR EXECUTION**
4. Run: `node .ai-global/automation/launcher.mjs --task "Your Task"`
