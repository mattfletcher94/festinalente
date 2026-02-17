---
task: "001"
spec: "tasks/001/spec.md"
status: approved
created: 2026-02-17
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 2
complexity: complex
---

# Plan: Expand 'Next Up' button to full section with directive hooks display

## Overview

Replace the inline action buttons in TaskDetail header with a dedicated "Next Up" section that shows action explanations and connected directives. The implementation follows the existing Computer/Capability/Orchestrator pattern: a new `hook-config` capability reads `.kanban/config.yaml` via IPC, and the existing `task-actions.computer.ts` is extended to map actions to hook names and explanations.

See full specification: tasks/001/spec.md

## Technical Approach

Following established patterns:
- **IPC Handler Pattern:** Main process reads YAML, returns parsed data - reference `apps/gui/electron/main/index.ts:136`
- **Capability Factory Pattern:** Wrap IPC in typed functions - reference `apps/gui/src/tasks/tasks-api.capability.ts`
- **Provider Pattern:** createContext for Vue provide/inject - reference `apps/gui/src/tasks/tasks.provider.ts`
- **Computer Pattern:** Pure functions for data transformation - reference `apps/gui/src/tasks/task-actions.computer.ts`

The hook name is derived from the command: `/kanban-scope 001` → `kanban-scope`. The computer maps each action to its hook name and provides explanation text.

## Module Structure

### Computers
- `task-actions.computer.ts` (modify) - Add `getHookName()` method to extract hook from command

### Capabilities
- `hook-config.capability.ts` (create) - IPC wrapper for reading hook config
  - Dependencies: None (computer not needed for simple YAML read)

### Orchestrators
- No new orchestrator needed - hook config is read on-demand, not reactive state

### Providers
- `hook-config.provider.ts` (create) - createContext wrapper
  - Exposes: `injectHookConfig`, `provideHookConfig`

### Types
- `hook-config-types.ts` (create) - HookConfig, DirectiveInfo types

## Dependency Graph

```
task-actions.computer.ts (pure)
         ↑
         │ (import)
         │
hook-config.capability.ts ─────→ IPC (main process)
         ↑
         │ (injected via DI)
         │
App.vue (composition root)
         │
         │ (provide)
         ↓
TaskDetail.vue (consume via inject)
```

Graph is acyclic - computers have no dependencies, capability imports nothing from other capabilities.

## Implementation Steps

### Phase 1: Backend (IPC Layer)

#### Step 1.1: Add IPC handler for hook config
**Files:** `apps/gui/electron/main/index.ts` (modify)
**Requirements:** FR6
**Pattern:** IPC handler at `apps/gui/electron/main/index.ts:136`

- [x] Import `js-yaml` (already available)
- [x] Add `ipcMain.handle('hooks:getConfig', ...)` handler
- [x] Read `.kanban/config.yaml` from project path
- [x] Parse YAML and return `hooks` object
- [x] Return empty object if file missing or malformed

**Snippet:**
```typescript
ipcMain.handle('hooks:getConfig', async (_, projectPath: string, hookName: string) => {
  const configPath = path.join(projectPath, '.kanban', 'config.yaml');
  if (!fs.existsSync(configPath)) return { directives: [] };

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = yaml.load(content) as { hooks?: Record<string, { directives?: string[] }> };
  return config?.hooks?.[hookName] ?? { directives: [] };
});
```

**Verify:** Handler responds to IPC call without crashing

#### Step 1.2: Expose hook config API in preload
**Files:** `apps/gui/electron/preload/index.ts` (modify)
**Requirements:** FR6
**Pattern:** Preload pattern at `apps/gui/electron/preload/index.ts:22`

- [x] Add `getHookConfig` method to electronAPI
- [x] Takes `projectPath` and `hookName` parameters

**Verify:** `window.electronAPI.getHookConfig` is available in renderer

### Phase 2: Frontend Types and Capability

#### Step 2.1: Create hook config types
**Files:** `apps/gui/src/hook-config/hook-config-types.ts` (create)
**Requirements:** FR4, FR5
**Pattern:** Type definitions following `apps/gui/src/tasks/task-types.ts`

- [x] Define `HookConfig` interface with `directives: string[]`
- [x] Export types

**Snippet:**
```typescript
export interface HookConfig {
  readonly directives: readonly string[];
}
```

**Verify:** Types compile without errors

#### Step 2.2: Create hook config capability
**Files:** `apps/gui/src/hook-config/hook-config.capability.ts` (create)
**Requirements:** FR6
**Pattern:** Capability at `apps/gui/src/tasks/tasks-api.capability.ts`

- [x] Define `CreateHookConfigCapabilityReturn` interface
- [x] Implement `createHookConfigCapability()` factory
- [x] Add `getConfig(projectPath, hookName)` method
- [x] Include TSDoc on all exports

**Verify:** Capability can be imported and instantiated

#### Step 2.3: Create hook config provider
**Files:** `apps/gui/src/hook-config/hook-config.provider.ts` (create)
**Requirements:** FR6
**Pattern:** Provider at `apps/gui/src/tasks/tasks.provider.ts`

- [x] Use `createContext<CreateHookConfigCapabilityReturn>('HookConfig')`
- [x] Export `injectHookConfig`, `provideHookConfig`

**Verify:** Provider exports compile correctly

#### Step 2.4: Create barrel export
**Files:** `apps/gui/src/hook-config/index.ts` (create)
**Requirements:** FR6

- [x] Export all from capability, provider, types

**Verify:** `import { ... } from '@/hook-config'` works

### Phase 3: Computer Enhancement

#### Step 3.1: Add hook name extraction to task actions computer
**Files:** `apps/gui/src/tasks/task-actions.computer.ts` (modify)
**Requirements:** FR2, FR4
**Pattern:** Computer method pattern in same file

- [x] Add `getHookName(command: string): string` method
- [x] Extract hook name from command (e.g., `/kanban-scope 001` → `kanban-scope`)
- [x] Update `CreateTaskActionsComputerReturn` interface
- [x] Add TSDoc for new method

**Snippet:**
```typescript
function getHookName(command: string): string {
  // "/kanban-scope 001" -> "kanban-scope"
  const match = command.match(/^\/([^\s]+)/);
  return match ? match[1] : '';
}
```

**Verify:** `getHookName('/kanban-scope 001')` returns `'kanban-scope'`

### Phase 4: Vue Integration

#### Step 4.1: Wire hook config capability in App.vue
**Files:** `apps/gui/src/App.vue` (modify)
**Requirements:** FR6
**Pattern:** Composition root at `apps/gui/src/App.vue`

- [x] Import `createHookConfigCapability`, `provideHookConfig`
- [x] Create capability instance
- [x] Provide to Vue tree

**Verify:** Capability is available via `injectHookConfig()`

#### Step 4.2: Update TaskDetail with Next Up section
**Files:** `apps/gui/src/components/TaskDetail.vue` (modify)
**Requirements:** FR1, FR2, FR3, FR4, FR5, FR7

- [x] Import `injectHookConfig`
- [x] Add `hookConfigs` ref to store config per action
- [x] Add watcher to load hook configs when actions change
- [x] Replace inline action buttons with Next Up section
- [x] Display action explanation text (from `action.description`)
- [x] Display directive names as comma-separated list when present
- [x] Hide directives list when empty
- [x] Style section with flex layout for auto-sizing

**Snippet (template structure):**
```vue
<!-- Next Up Section -->
<div v-if="actions.length > 0" class="px-4 py-3 border-b border-border bg-muted/30">
  <div v-for="action in actions" :key="action.command" class="flex items-center justify-between gap-4">
    <div class="flex-1">
      <div class="text-sm font-medium">{{ action.label }}</div>
      <div class="text-xs text-muted-foreground">{{ action.description }}</div>
      <div v-if="hookConfigs[action.command]?.directives.length" class="text-xs text-muted-foreground mt-1">
        Directives: {{ hookConfigs[action.command].directives.join(', ') }}
      </div>
    </div>
    <Button size="sm" @click="app.runCommand(action.command)">Run</Button>
  </div>
</div>
```

**Verify:** Next Up section displays with action, explanation, directives, and Run button

### Phase 5: Final Verification

- [x] All acceptance criteria from task met
- [x] Section appears below header, above tabs
- [x] Action explanation displays correctly
- [x] Directives show when configured, hidden when empty
- [x] Run button executes command in terminal
- [x] No regressions in existing task detail functionality
- [x] Acyclic dependencies verified (`pnpm check:dpdm`)

## Testing Strategy

- **Automated:** None required - UI feature with IPC, manual verification appropriate
- **Manual:**
  - Select task in each workflow status, verify correct actions display
  - Verify explanation text matches action description
  - Select task where hook has directives configured (e.g., scoped task → plan action), verify directives display
  - Select task where hook has no directives, verify directives list hidden
  - Click Run button, verify command executes in terminal
  - Resize panel, verify section auto-sizes
- **Regression:** Verify existing task detail tabs and content still work

## Edge Cases

- Config file missing — return empty directives array, section still shows actions
- Config file malformed YAML — catch parse error, return empty directives
- Hook name not found in config — return empty directives, action still displays
- Multiple actions for same status (e.g., in-progress) — show all with individual directive lists

## Potential Pitfalls

- Hook name extraction — ensure regex handles all command formats correctly; test with commands that have flags or no args
- Async hook config loading — load configs when actions change, not on every render; use watcher pattern
- Template rendering order — ensure hookConfigs ref is initialized before template accesses it; use optional chaining

## Iterations

### Attempt 1 — QA Failed (2026-02-17)
**Phase:** qa
**Result:** failed

**Issues:**
- [ ] Remove file-level TSDoc comments from `hook-config.capability.ts` (line 1-3) — forbidden pattern per TSDoc directive
- [ ] Check all new files in `apps/gui/src/hook-config/` for file-level TSDoc comments and remove them

**Action:** Address issues above, then re-verify

---
