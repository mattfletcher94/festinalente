---
id: "systems/distribution"
title: "Package Distribution System"
type: system
tldr: "Private npm distribution via GitHub Packages with npx installer"
summary: "Build, publish, and install workflow using GitHub Packages registry for private npm distribution"
keywords: [distribution, npm, github-packages, publish, npx, installer, package]
aliases: [publishing, npm-distribution, package-publishing]
boundary: "Does not handle public npm registry or alternative package managers"
related:
  - systems/cli
paths:
  - apps/kanban
  - apps/kanban/bin
updated: 2026-02-21
verified: 2026-02-21
code_refs:
  - apps/kanban/package.json
  - apps/kanban/bin/install.cjs
  - package.json
---

# Package Distribution System

> **TL;DR:** Private npm distribution via GitHub Packages with npx installer

## Overview

The Package Distribution System enables claude-kanban to be installed into any repository via `npx @mattfletcher94/claudeban`. It uses GitHub Packages as a private npm registry, leveraging existing GitHub authentication and repository permissions.

**Why it exists:** Allows distribution of kanban tooling without publishing to public npm. Users with repo access can install; others cannot.

**Summary:** Build pipeline + GitHub Packages registry + npx-compatible installer.

## Components

| Component | Purpose | File |
|-----------|---------|------|
| package.json | Package metadata and publishConfig | `apps/kanban/package.json` |
| install.cjs | CLI installer copying skills and kanban files | `apps/kanban/bin/install.cjs` |
| root package.json | Monorepo publish script | `package.json` |

**Summary:** Three files coordinate build, publish, and install.

## Key Patterns

This system follows these patterns:

- **prepublishOnly hook** - Build runs automatically before publish
- **bin entry** - Package exposes CLI via `bin` field in package.json
- **Restricted access** - `publishConfig.access: "restricted"` keeps package private

## Data Flow

```
pnpm kanban:publish
       ↓
prepublishOnly → pnpm build
       ↓
Build tools, scripts, content to dist/
       ↓
Publish to npm.pkg.github.com
       ↓
User runs: npx @mattfletcher94/claudeban
       ↓
install.cjs copies:
  - dist/skills/ → .claude/skills/
  - dist/scripts/ → .kanban/scripts/
  - dist/templates/ → .kanban/templates/
  - dist/workflow.yaml → .kanban/workflow.yaml
```

## Build Process

The build process creates a distributable `dist/` folder:

```bash
pnpm build
  ├── build:tools     # Compile tools/*.ts → dist/tools/
  ├── build:scripts   # Compile src/scripts/*.ts → dist/scripts/
  └── build:content   # Copy skills, templates, workflow → dist/
```

## Installer Behavior

The installer (`bin/install.cjs`) performs these steps:

1. **Install skills** - Copy `dist/skills/` to `.claude/skills/`
2. **Install kanban files** - Copy scripts, templates, workflow to `.kanban/`
3. **Setup config** - Create `config.yaml` and `glossary.yaml` if missing (won't overwrite)
4. **Save manifest** - Write `manifest.json` with version and install timestamp

### Change Detection

The installer uses SHA-256 hashing to detect changes:
- Files with different hashes: logged as "Updated"
- New files: logged as "Added"
- Unchanged files: silently skipped

## Interactions

| System | Relationship | Notes |
|--------|--------------|-------|
| [cli](../cli/_index.md) | Scripts distributed | dist/scripts/ contains compiled CLI scripts |
| [storage](../storage/_index.md) | Directory structure | Installer creates .kanban/ structure |

**Summary:** Distribution system packages CLI scripts and creates the storage directory structure.

## Boundaries

What this system does NOT handle:

- **Does NOT:** Publish to public npm registry - uses GitHub Packages only
- **Does NOT:** Support Yarn/Bun directly - npx/npm only (may work but untested)
- **Does NOT:** Auto-update installed packages - users must re-run npx

## Configuration

| Setting | Description | Location |
|---------|-------------|----------|
| `publishConfig.registry` | Target registry URL | `apps/kanban/package.json` |
| `publishConfig.access` | Package visibility (restricted) | `apps/kanban/package.json` |
| `repository.url` | Links to GitHub repo | `apps/kanban/package.json` |

## User Setup

Users must configure npm to use GitHub Packages:

```bash
# Add to ~/.npmrc
@mattfletcher94:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<GITHUB_PAT>
```

The PAT requires `read:packages` scope.

## Limitations

- GitHub Packages free tier: 500MB storage, 1GB bandwidth/month
- Users must have GitHub account with repository access
- No automatic updates - users re-run npx for new versions
