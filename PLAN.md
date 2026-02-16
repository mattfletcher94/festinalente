# Monorepo Migration Plan

## Overview

Convert the current single-package structure into a pnpm workspaces monorepo, preparing for future apps (like a GUI) while keeping the existing `claude-kanban` package functional.

---

## Current Structure

```
claudeban/
├── .claude/
│   └── settings.local.json
├── src/
│   ├── content/
│   │   ├── skills/
│   │   ├── partials/
│   │   └── kanban-templates/
│   └── scripts/
├── dist/
├── bin/
├── tools/
├── node_modules/
├── package.json          # name: "claude-kanban"
├── pnpm-lock.yaml
├── turbo.json
├── tsconfig.json
├── tsdown.config.ts
├── README.md
└── GUIDE.md
```

---

## Target Structure

```
claudeban/
├── .claude/
│   └── settings.local.json     # Stays at root (Claude Code config)
├── apps/
│   └── kanban/                 # Existing package (moved)
│       ├── src/
│       │   ├── content/
│       │   │   ├── skills/
│       │   │   ├── partials/
│       │   │   └── kanban-templates/
│       │   └── scripts/
│       ├── dist/
│       ├── bin/
│       ├── tools/
│       ├── package.json        # name: "claude-kanban"
│       ├── tsconfig.json       # extends ../../tsconfig.base.json
│       └── tsdown.config.ts
│
├── pnpm-workspace.yaml         # Workspace definition
├── turbo.json                  # Root turbo config (replaces old one)
├── package.json                # Root (private, scripts only)
├── tsconfig.json               # Project references only
├── tsconfig.base.json          # Shared compiler options
├── README.md
├── GUIDE.md
└── PLAN.md
```

---

## Root Config Files

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
```

### package.json (root)

```json
{
  "name": "claude-kanban-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.2",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "clean": "turbo clean",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

### turbo.json (root)

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": false
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

### tsconfig.json (root - project references only)

```json
{
  "files": [],
  "references": [
    { "path": "./apps/kanban" }
  ]
}
```

### tsconfig.base.json (shared compiler options)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

## apps/kanban Config Updates

### tsconfig.json (apps/kanban)

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tools"]
}
```

### package.json changes

- Keep `name: "claude-kanban"`
- Remove `turbo` from devDependencies (now at root)
- Keep all other dependencies and scripts

---

## Migration Steps

### 1. Clean up before migration

```bash
# Remove node_modules and lockfile (will reinstall after restructure)
rm -rf node_modules pnpm-lock.yaml

# Delete old turbo.json (will be replaced with new root config)
rm turbo.json
```

### 2. Create directory structure

```bash
mkdir -p apps/kanban
```

### 3. Move kanban app files

```bash
# Move app-specific files to apps/kanban/
mv src apps/kanban/
mv dist apps/kanban/
mv bin apps/kanban/
mv tools apps/kanban/
mv tsdown.config.ts apps/kanban/
mv package.json apps/kanban/

# Backup old tsconfig (we'll create a new one that extends base)
mv tsconfig.json apps/kanban/tsconfig.json.old
```

### 4. Create root pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
```

### 5. Create root package.json

```json
{
  "name": "claude-kanban-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@9.15.2",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "clean": "turbo clean",
    "typecheck": "turbo typecheck"
  },
  "devDependencies": {
    "turbo": "^2.4.0",
    "typescript": "^5.7.0"
  }
}
```

### 6. Create root turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"],
      "cache": false
    },
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "clean": {
      "cache": false
    }
  }
}
```

### 7. Create root tsconfig.json (project references)

```json
{
  "files": [],
  "references": [
    { "path": "./apps/kanban" }
  ]
}
```

### 8. Create root tsconfig.base.json

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

### 9. Create new apps/kanban/tsconfig.json

Create a new tsconfig that extends the base (replaces the .old backup):

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src", "tools"]
}
```

You can now delete `apps/kanban/tsconfig.json.old`.

### 10. Update apps/kanban/package.json

- Remove `turbo` from devDependencies (now at root)
- Ensure scripts still work (they should, paths are relative)

### 11. Reinstall dependencies

```bash
pnpm install
```

### 12. Verify build

```bash
pnpm build
```

### 13. Test the package

```bash
cd apps/kanban
pnpm build
# Verify dist/ output is correct
```

---

## Success Criteria

- [ ] `pnpm install` works from root
- [ ] `pnpm build` builds apps/kanban successfully
- [ ] `pnpm clean` works
- [ ] `npx claude-kanban` still works (when published)
- [ ] apps/kanban/dist/ contains correct output
- [ ] No circular dependency issues
- [ ] Git history preserved

---

## Notes

- The `claude-kanban` package remains publishable to npm
- Root package.json is private (not published)
- Future apps (e.g., GUI) will be added to `apps/` folder
- Shared code can later be extracted to `packages/` if needed
