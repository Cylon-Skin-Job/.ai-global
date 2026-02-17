# Universal AI Context (.ai)

This is the universal context and rules repository that can be shared across multiple projects.

## Structure

- **UNIVERSAL_DESIGN_SPEC.md** - The architectural standard for all projects (7-layer architecture)
- **rules/** - Project-agnostic coding rules and conventions (future)

## Usage in Projects

Add as a git submodule in your project:

```bash
cd your-project
git submodule add https://github.com/your-org/.ai .ai
git commit -m "chore: add universal AI context as submodule"
```

## Current Location (Development)

This repo is currently at:
```
/Users/rccurtrightjr./Documents/GitHub/.ai
```

## Projects Using This

- [exjw-librarian](https://github.com/your-org/exjw-librarian)
- [raven-os](https://github.com/your-org/raven-os)

## Maintaining

This repo contains universal rules that should be consistent across all projects.
