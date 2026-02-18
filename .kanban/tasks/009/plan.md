---
task: "009"
spec: "tasks/009/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: medium
---

# Plan: Add dropdown menu to Add Task button with Create Task and Discover options

## Overview

Replace the icon-only ghost-variant "+" button in TaskList header with a prominent "New +" dropdown menu button. The dropdown contains "Create Task" and "Discover" options, each with title and description. Clicking an option runs the corresponding kanban command (`/kanban-create` or `/kanban-discover`) via the app orchestrator.

This follows the existing pattern where `createTask()` calls `runCommand('/kanban-create')` at `apps/gui/src/app/app.orchestrator.ts:112-114`. The dropdown uses shadcn-vue's dropdown-menu component which re-exports reka-ui primitives (same pattern as collapsible at `apps/gui/src/components/ui/collapsible/index.ts:1`).

See full specification: tasks/009/spec.md

## Technical Approach

**Component Installation:** Install shadcn-vue dropdown-menu via CLI, which generates a component folder with re-exported reka-ui primitives. This matches the existing collapsible pattern.

**Orchestrator Extension:** Add `discover()` method to app orchestrator following the exact pattern of `createTask()`. Both methods delegate to `runCommand()` with the appropriate kanban command.

**Component Update:** Replace the icon button with dropdown trigger. Use shadcn DropdownMenuItem with custom layout for title + description (nested elements within menu item slot).

**Architecture Compliance:**
- No new computers, capabilities, or providers needed
- Orchestrator gains one method following existing pattern
- Component remains thin (just calls orchestrator methods)

## Implementation Steps

### Step 1: Install shadcn dropdown-menu component
**Files:** `apps/gui/src/components/ui/dropdown-menu/` (create via CLI)
**Requirements:** Technical Constraint
**Pattern:** Re-export pattern at `apps/gui/src/components/ui/collapsible/index.ts:1`

- [ ] Navigate to `apps/gui/` directory
- [ ] Run `pnpm dlx shadcn-vue@latest add dropdown-menu`
- [ ] Verify generated files follow re-export pattern

**Verify:** `apps/gui/src/components/ui/dropdown-menu/index.ts` exists and exports components

### Step 2: Add discover method to app orchestrator
**Files:** `apps/gui/src/app/app.orchestrator.ts` (modify)
**Requirements:** FR6
**Pattern:** `createTask()` at `apps/gui/src/app/app.orchestrator.ts:112-114`

- [ ] Add `discover(): void` to `CreateAppOrchestratorReturn` interface
- [ ] Implement `discover()` function calling `runCommand('/kanban-discover')`
- [ ] Add `discover` to returned object

**Verify:** TypeScript compiles, orchestrator exports `discover` method

### Step 3: Update TaskList with dropdown menu
**Files:** `apps/gui/src/components/TaskList.vue` (modify)
**Requirements:** FR1, FR2, FR3, FR4, FR5, FR7

- [ ] Import dropdown-menu components from `./ui/dropdown-menu`
- [ ] Import `ChevronDown` icon (already using lucide-vue-next)
- [ ] Replace the `+` Button with `DropdownMenu` wrapper
- [ ] Create `DropdownMenuTrigger` as Button with "New +" text, `default` variant, `sm` size
- [ ] Add `DropdownMenuContent` with alignment to end
- [ ] Add "Create Task" `DropdownMenuItem` with title "Create Task" and description "Add a task directly"
- [ ] Add "Discover" `DropdownMenuItem` with title "Discover" and description "Explore ideas through Q&A"
- [ ] Wire "Create Task" to call `app.createTask()`
- [ ] Wire "Discover" to call `app.discover()`
- [ ] Remove old `handleCreateTask` function (inline the call or use directly)

**Verify:** Button displays "New +", dropdown opens on click, both options visible with descriptions

### Step 4: Final verification
- [ ] Button labeled "New +" with primary/default variant styling
- [ ] Dropdown opens on click
- [ ] "Create Task" option shows title and "Add a task directly" description
- [ ] "Discover" option shows title and "Explore ideas through Q&A" description
- [ ] Clicking "Create Task" runs `/kanban-create` in terminal
- [ ] Clicking "Discover" runs `/kanban-discover` in terminal
- [ ] Dropdown closes after selection
- [ ] No regressions in existing task list functionality

## Testing Strategy

- **Automated:** None required (UI component, manual verification sufficient)
- **Manual:**
  - Click "New +" button, verify dropdown appears
  - Verify both options display with title and description
  - Click "Create Task", verify terminal runs `/kanban-create`
  - Click "Discover", verify terminal runs `/kanban-discover`
  - Verify dropdown closes after each selection
  - Verify clicking outside dropdown closes it
- **Regression:** Verify task list still loads, selecting tasks still works, folder change still works

## Edge Cases

- Terminal not ready when option selected — `runCommand()` already handles this with early return at line 90
- No project selected — same handling, `runCommand()` returns early
- Rapid option clicks — dropdown closes immediately, preventing double-execution

## Potential Pitfalls

- shadcn CLI generates wrong style — run from `apps/gui/` where `components.json` exists with "new-york" style config
- DropdownMenuItem styling for title+description — use nested elements within menu item slot, not separate components
