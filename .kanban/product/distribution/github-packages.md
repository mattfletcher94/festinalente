---
id: "distribution/github-packages"
title: "GitHub Packages Distribution"
type: feature
tldr: "Install claude-kanban privately via npx using GitHub Packages registry"
summary: "Private npm distribution through GitHub Packages allowing installation via npx @mattfletcher94/claudeban"
keywords: [github, packages, npm, registry, private, distribution, publish, npx, install]
aliases: [npm distribution, private package, github npm]
boundary: "Does not cover public npm registry publishing or alternative package managers"
related: []
updated: 2026-02-21
verified: 2026-02-21
code_refs:
  - apps/kanban/package.json
  - apps/kanban/bin/install.cjs
  - package.json
---

# GitHub Packages Distribution

> **TL;DR:** Install claude-kanban privately via npx using GitHub Packages registry

## Overview

GitHub Packages Distribution enables private npm-compatible distribution of claude-kanban. Users with GitHub repository access can install the package using standard npx commands without needing a separate npm account.

**Summary:** Private package distribution using existing GitHub authentication and repository permissions.

## How It Works

1. Developer runs `pnpm kanban:publish` from the monorepo root
2. Package builds via `prepublishOnly` script
3. Package publishes to GitHub Packages registry at `npm.pkg.github.com`
4. Users with repo access run `npx @mattfletcher94/claudeban`
5. Package installs skills and kanban files to target repository

### Key Workflows

**Publishing:**
- Run `pnpm kanban:publish` from monorepo root
- Build runs automatically via `prepublishOnly`
- Publishes to GitHub Packages with restricted access

**Installing:**
- Configure `~/.npmrc` with GitHub Packages registry and PAT
- Run `npx @mattfletcher94/claudeban` in target repository
- Skills install to `.claude/skills/`
- Kanban files install to `.kanban/`

**Summary:** Build, publish, and install via standard npm tooling.

## Examples

### Publishing the Package

```bash
# From monorepo root
pnpm kanban:publish
```

### User Installation

```bash
# Configure npm to use GitHub Packages for this scope
echo "@mattfletcher94:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> ~/.npmrc

# Install to current repository
npx @mattfletcher94/claudeban
```

### Install Command Options

```bash
# Show help
npx @mattfletcher94/claudeban --help

# Show version
npx @mattfletcher94/claudeban --version
```

**Summary:** Standard npx workflow with GitHub authentication.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Publish to public npm registry - package stays private
- **Does NOT:** Work without GitHub authentication - requires PAT with `read:packages` scope
- **Does NOT:** Support alternative package managers like Yarn or Bun directly (they may work but are untested)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| `publishConfig.registry` | Target registry URL | `https://npm.pkg.github.com` |
| `publishConfig.access` | Package visibility | `restricted` |
| `repository.url` | Links package to GitHub repo | `https://github.com/mattfletcher94/claudeban` |

## Interactions

- **GitHub Repository**: Package access is tied to repository permissions
- **GitHub PAT**: Users need a Personal Access Token with `read:packages` scope

## Limitations

- Requires GitHub account with repository access
- Users must configure `~/.npmrc` before first install
- GitHub Packages free tier: 500MB storage, 1GB bandwidth/month
