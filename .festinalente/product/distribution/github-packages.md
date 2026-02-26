---
id: "distribution/github-packages"
title: "GitHub Packages Distribution"
type: feature
tldr: "Install claude-kanban tools privately via npx using GitHub Packages registry"
summary: "Private npm distribution through GitHub Packages for both kanban CLI and VSCode extension"
keywords: [github, packages, npm, registry, private, distribution, publish, npx, install, vscode, extension]
aliases: [npm distribution, private package, github npm, vscode installer]
boundary: "Does not cover public npm registry publishing or alternative package managers"
related: []
updated: 2026-02-21
verified: 2026-02-21
code_refs:
  - apps/kanban/package.json
  - apps/kanban/bin/install.cjs
  - apps/vscode/package.json
  - apps/vscode/bin/install.cjs
  - package.json
---

# GitHub Packages Distribution

> **TL;DR:** Install claude-kanban tools privately via npx using GitHub Packages registry

## Overview

GitHub Packages Distribution enables private npm-compatible distribution of claude-kanban tools. Users with GitHub repository access can install packages using standard npx commands without needing a separate npm account. Two packages are available:

- **Kanban CLI** (`@mattfletcher94/claudeban`) - Installs skills and kanban files to a repository
- **VSCode Extension** (`@mattfletcher94/claudeban-vscode`) - Installs the Claude Kanban VSCode extension

**Summary:** Private package distribution using existing GitHub authentication and repository permissions.

## How It Works

### Kanban CLI Package

1. Developer runs `pnpm kanban:publish` from the monorepo root
2. Package builds via `prepublishOnly` script
3. Package publishes to GitHub Packages registry at `npm.pkg.github.com`
4. Users with repo access run `npx @mattfletcher94/claudeban`
5. Package installs skills and kanban files to target repository

### VSCode Extension Package

1. Developer runs `pnpm vscode:publish` from the monorepo root
2. Extension builds and packages into a .vsix file
3. Package publishes to GitHub Packages registry
4. Users with repo access run `npx @mattfletcher94/claudeban-vscode`
5. Installer finds the bundled .vsix and runs `code --install-extension`

### Key Workflows

**Publishing Kanban CLI:**
- Run `pnpm kanban:publish` from monorepo root
- Build runs automatically via `prepublishOnly`
- Publishes to GitHub Packages with restricted access

**Publishing VSCode Extension:**
- Run `pnpm vscode:publish` from monorepo root
- Builds extension, packages .vsix, and publishes to GitHub Packages
- The .vsix file is bundled in the npm package

**Installing Kanban CLI:**
- Configure `~/.npmrc` with GitHub Packages registry and PAT
- Run `npx @mattfletcher94/claudeban` in target repository
- Skills install to `.claude/skills/`
- Kanban files install to `.kanban/`

**Installing VSCode Extension:**
- Configure `~/.npmrc` with GitHub Packages registry and PAT
- Run `npx @mattfletcher94/claudeban-vscode`
- Installer runs `code --install-extension` with the bundled .vsix
- Extension appears in VSCode activity bar

**Summary:** Build, publish, and install via standard npm tooling.

## Examples

### Publishing Packages

```bash
# From monorepo root - publish kanban CLI
pnpm kanban:publish

# From monorepo root - publish VSCode extension
pnpm vscode:publish
```

### User Installation - Kanban CLI

```bash
# Configure npm to use GitHub Packages for this scope
echo "@mattfletcher94:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> ~/.npmrc

# Install to current repository
npx @mattfletcher94/claudeban
```

### User Installation - VSCode Extension

```bash
# Configure npm (if not already done)
echo "@mattfletcher94:registry=https://npm.pkg.github.com" >> ~/.npmrc
echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> ~/.npmrc

# Install VSCode extension
npx @mattfletcher94/claudeban-vscode
```

### Install Command Options

```bash
# Kanban CLI options
npx @mattfletcher94/claudeban --help
npx @mattfletcher94/claudeban --version

# VSCode extension options
npx @mattfletcher94/claudeban-vscode --help
npx @mattfletcher94/claudeban-vscode --version
```

**Summary:** Standard npx workflow with GitHub authentication.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Publish to public npm registry - package stays private
- **Does NOT:** Work without GitHub authentication - requires PAT with `read:packages` scope
- **Does NOT:** Support alternative package managers like Yarn or Bun directly (they may work but are untested)

## Configuration

Both packages share the same configuration pattern:

| Setting | Description | Default |
|---------|-------------|---------|
| `publishConfig.registry` | Target registry URL | `https://npm.pkg.github.com` |
| `publishConfig.access` | Package visibility | `restricted` |
| `repository.url` | Links package to GitHub repo | `https://github.com/mattfletcher94/claudeban` |

### VSCode Extension Requirements

The VSCode extension installer requires the `code` command to be available in PATH. This is the standard VSCode CLI that can be installed via:
- VSCode Command Palette: "Shell Command: Install 'code' command in PATH"

## Interactions

- **GitHub Repository**: Package access is tied to repository permissions
- **GitHub PAT**: Users need a Personal Access Token with `read:packages` scope

## Limitations

- Requires GitHub account with repository access
- Users must configure `~/.npmrc` before first install
- GitHub Packages free tier: 500MB storage, 1GB bandwidth/month
