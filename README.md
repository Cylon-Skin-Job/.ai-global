# Universal AI Context (ai-global)

This is the universal context and rules repository that can be shared across multiple projects.

## Structure

- **UNIVERSAL_DESIGN_SPEC.md** - The architectural standard for all projects (7-layer architecture)
- **rules/** - Project-agnostic coding rules and conventions (future)
- **persona/** - AI personality and system prompt (Jason)

## Usage in Projects

Add as a git submodule in your project:

```bash
cd your-project
git submodule add /Users/rccurtrightjr./Documents/GitHub/ai-global ai-global
git commit -m "chore: add universal AI context (ai-global) as submodule"
```

## Current Location (Development)

This repo is currently at:
```
/Users/rccurtrightjr./Documents/GitHub/ai-global
```

## Projects Using This

- exjw-librarian
- raven-os

## Maintaining

This repo contains universal rules that should be consistent across all projects.
