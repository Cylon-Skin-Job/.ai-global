# Universal AI Context (.ai)

This is the universal context and rules repository that can be shared across multiple projects.

## Structure

- **UNIVERSAL_DESIGN_SPEC.md** - The architectural standard for all projects (7-layer architecture)
- **rules/** - Project-agnostic coding rules and conventions (future)

## Usage

Each project should link or copy from this repository to get the universal context.

### Local Path

This repo is located at:

```
/Users/rccurtrightjr./Documents/GitHub/.ai
```

### Option 1: Submodule

Add as a git submodule in each project:

```bash
cd your-project
git submodule add /Users/rccurtrightjr./Documents/GitHub/.ai .ai
```

### Option 2: Copy

Copy the files you need into your project's .ai/ folder.

## Projects Using This

- exjw-librarian
- raven-os

## Maintaining

This repo contains universal rules that should be consistent across all projects. When making changes:

1. Test in one project first
2. Update documentation
3. Keep backwards compatibility when possible
