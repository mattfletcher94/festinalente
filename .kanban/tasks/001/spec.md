---
task: "001"
created: 2026-02-17
updated: 2026-02-17
---

# Functional Specification: Expand 'Next Up' button to full section with directive hooks display

## Context

Currently, workflow actions appear as buttons in the task detail header alongside the title and badges. Users lack visibility into what the next workflow action will do and which custom directives influence each step. This change creates a dedicated "Next Up" section that displays action explanations and connected directives, providing transparency before users proceed with workflow actions.

## Scope

### In Scope
- New "Next Up" section in TaskDetail component
- Display action explanation text for each available action
- Display comma-separated list of directive names when configured
- New IPC handler to read hook configuration from `.kanban/config.yaml`
- New capability for hook config retrieval

### Out of Scope
- Clicking directive names to view directive content
- Editing directives from the GUI
- Caching hook config across sessions
- Multiple project support

## Functional Requirements

- FR1: The system shall display a "Next Up" section below the title/badges header and above the tabs in TaskDetail
- FR2: The system shall show an explanation of each available workflow action in the Next Up section
- FR3: The system shall display a "Run" button for each action that executes the command in the terminal
- FR4: The system shall display directive names as a comma-separated list below the action when directives are configured for that hook
- FR5: The system shall hide the directives list entirely when no directives are configured for the action's hook
- FR6: The system shall read hook configuration from `.kanban/config.yaml` via IPC
- FR7: The section shall auto-size based on content using flex layout

## Affected Files

- `apps/gui/electron/main/index.ts` (modify) - Add IPC handler for reading hook config
- `apps/gui/electron/preload/index.ts` (modify) - Expose hook config API to renderer
- `apps/gui/src/hook-config/hook-config.capability.ts` (create) - Capability for hook config IPC
- `apps/gui/src/hook-config/hook-config.provider.ts` (create) - Provider for hook config
- `apps/gui/src/hook-config/hook-config-types.ts` (create) - Types for hook config
- `apps/gui/src/hook-config/index.ts` (create) - Barrel export
- `apps/gui/src/tasks/task-actions.computer.ts` (modify) - Add action-to-hook mapping and explanation text
- `apps/gui/src/components/TaskDetail.vue` (modify) - Add Next Up section below header
- `apps/gui/src/App.vue` (modify) - Wire up hook config capability

## Existing Patterns

- **IPC Handler Pattern:** Read file, parse, return data
  - Reference: `apps/gui/electron/main/index.ts:136` (tasks:list handler)
- **Capability Factory Pattern:** Wrap IPC calls in typed functions
  - Reference: `apps/gui/src/tasks/tasks-api.capability.ts`
- **Provider Pattern:** createContext for Vue provide/inject
  - Reference: `apps/gui/src/tasks/tasks.provider.ts`
- **Computer Pattern:** Pure functions for data transformation
  - Reference: `apps/gui/src/tasks/task-actions.computer.ts`

## Technical Constraints

- Must follow acyclic architecture (Computer <- Capability <- Orchestrator)
- Components must be thin - logic in orchestrators/computers
- Must use `createContext` pattern for provide/inject
- Must use explicit TypeScript return types on exports
- Hook names derive from command by extracting the action name (e.g., `/kanban-scope 001` -> `kanban-scope`)

## Dependencies

### External
- `js-yaml` - Already used in main process, needed for parsing config.yaml

### Internal
- Terminal orchestrator - For running commands via `app.runCommand()`
- Tasks orchestrator - For selected task and actions

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Config file missing or malformed | Medium | Return empty directives array, don't crash |
| Hook name not found in config | Low | Return empty directives, section still shows actions |

## Open Questions

- [ ] None - all questions resolved during scoping
