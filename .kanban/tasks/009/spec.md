---
task: "009"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Add dropdown menu to Add Task button with Create Task and Discover options

## Context

The kanban-discover skill (added in task 008) allows users to explore ideas through Socratic Q&A before creating tasks. However, this feature is only accessible via CLI commands. Users viewing the kanban board in the GUI must switch to the terminal to use Discover, fragmenting the task creation workflow.

The current "Add Task" button is a ghost-variant icon-only button that's difficult to find. As the primary user action, it should be prominently visible.

## Scope

### In Scope
- Replace the icon button with a dropdown menu button
- Add "Create Task" and "Discover" options to the dropdown
- Each option displays title and description
- Style the button to be prominent (always visible background)
- Add `discover()` method to app orchestrator

### Out of Scope
- Keyboard shortcuts for dropdown items
- Additional dropdown options beyond Create Task and Discover
- Changes to the kanban-discover skill itself

## Functional Requirements

- FR1: The system shall display a button labeled "New +" with a default (primary) variant styling in the TaskList header
- FR2: The system shall open a dropdown menu when the user clicks the "New +" button
- FR3: The dropdown menu shall display a "Create Task" option with the description "Add a task directly"
- FR4: The dropdown menu shall display a "Discover" option with the description "Explore ideas through Q&A"
- FR5: The system shall run `/kanban-create` in the terminal when the user selects "Create Task"
- FR6: The system shall run `/kanban-discover` in the terminal when the user selects "Discover"
- FR7: The system shall close the dropdown menu after the user selects an option

## Affected Files

- `apps/gui/src/components/ui/dropdown-menu/` (create via CLI) - shadcn dropdown-menu component
- `apps/gui/src/components/TaskList.vue` (modify) - replace button with dropdown menu
- `apps/gui/src/app/app.orchestrator.ts` (modify) - add `discover()` method

## Existing Patterns

- **Pattern:** Command execution via orchestrator method
  - Reference: `apps/gui/src/app/app.orchestrator.ts:112-114` - `createTask()` calls `runCommand('/kanban-create')`
- **Pattern:** Re-exporting reka-ui primitives for shadcn components
  - Reference: `apps/gui/src/components/ui/collapsible/index.ts:1` - direct re-export from reka-ui
- **Pattern:** Button variants for styling
  - Reference: `apps/gui/src/components/ui/button/Button.vue:10-11` - `default` variant has primary background

## Technical Constraints

- Must install dropdown-menu component via shadcn-vue CLI: `pnpm dlx shadcn-vue@latest add dropdown-menu`
- Must run installation from `apps/gui/` directory where `components.json` exists
- shadcn-vue is configured with "new-york" style

## Dependencies

### External
- shadcn-vue dropdown-menu component (to be installed via CLI)
- reka-ui DropdownMenu primitives (dependency of shadcn-vue)

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| CLI installation may add unexpected files | Low | Review generated files before committing |

## Open Questions

- None
