---
task: "012"
spec: "tasks/012/spec.md"
status: approved
created: 2026-02-18
generated_by: claude
model: claude-opus-4-5-20251101
version: 1
iteration: 1
complexity: medium
---

# Plan: Delete a task skill: kanban-delete

## Overview

Implement a new kanban skill that allows users to delete tasks from Backlog or Refined status. The skill validates branch (must be main), status (only backlog/refined allowed), displays task details, requires confirmation, removes the task folder, and commits the deletion. This follows the existing skill pattern from `kanban-create` and script pattern from `find-task.ts`.

See full specification: tasks/012/spec.md

## Technical Approach

**Skill Pattern:** Following `apps/kanban/src/content/skills/kanban-create/SKILL.md` for structure:
- YAML frontmatter with `allowed-tools`, `argument-hint`
- Process steps using `{{> partials}}` for common operations
- AskUserQuestion for confirmation
- Git commit on success

**Script Pattern:** Following `apps/kanban/src/scripts/find-task.ts` for the delete script:
- TypeScript with gray-matter for frontmatter parsing
- JSON output format with error handling
- Exit codes for success/failure

**Workflow Update:** Adding `delete` commit format following existing patterns in `kanban-workflow.yaml`.

## Implementation Steps

### Step 1: Add delete commit format to workflow
**Files:** `apps/kanban/src/content/kanban-workflow.yaml` (modify)
**Requirements:** FR7

- [ ] Add `delete: "docs({id}): delete - {title}"` to the commits section
- [ ] Place after `done:` entry to maintain logical grouping

**Verify:** File parses as valid YAML, new commit format is present

### Step 2: Create delete-task script
**Files:** `apps/kanban/src/scripts/delete-task.ts` (create)
**Requirements:** FR3, FR6
**Pattern:** Script pattern from `apps/kanban/src/scripts/find-task.ts:1-66`

- [ ] Create TypeScript file with shebang and imports (fs, path, gray-matter)
- [ ] Accept task ID as argument
- [ ] Validate task exists using find-task pattern
- [ ] Validate task status is `backlog` or `refined`
- [ ] Delete entire task folder using `fs.rmSync` with `recursive: true`
- [ ] Return JSON output: `{ success: true, id, title, path }` or `{ error: true, message }`

**Snippet:**
```typescript
// Validation
if (status !== 'backlog' && status !== 'refined') {
  console.log(JSON.stringify({
    error: true,
    message: `Cannot delete task in ${status} status. Only backlog/refined allowed.`
  }));
  process.exit(1);
}

// Deletion
const taskFolder = path.join(TASKS_DIR, id);
fs.rmSync(taskFolder, { recursive: true, force: true });
```

**Verify:** Script compiles, handles all error cases, returns correct JSON

### Step 3: Create kanban-delete skill definition
**Files:** `apps/kanban/src/content/skills/kanban-delete/SKILL.md` (create)
**Requirements:** FR1, FR2, FR4, FR5, FR8, FR9
**Pattern:** Skill structure from `apps/kanban/src/content/skills/kanban-create/SKILL.md`

- [ ] Create skill folder `apps/kanban/src/content/skills/kanban-delete/`
- [ ] Create SKILL.md with YAML frontmatter:
  - `name: kanban-delete`
  - `description: Delete a task from the kanban board. Only works for tasks in Backlog or Refined status.`
  - `allowed-tools: Read, Bash(node *, git add *, git commit *, git status, git branch *), AskUserQuestion`
  - `argument-hint: "[task-id]"`
  - `disable-model-invocation: true`
- [ ] Add `<purpose>` section
- [ ] Add `<context>` with helper-scripts partial (show_find_task, show_list_tasks)
- [ ] Add `<prohibited>` section
- [ ] Add `<process>` with steps:
  1. `load_workflow` - Read workflow.yaml
  2. `verify_branch` - Use `{{> branch-verify-main}}` partial
  3. `get_task_id` - Accept argument or prompt with list of eligible tasks
  4. `read_task_file` - Use find-task.cjs, validate status
  5. `display_task_details` - Show ID, title, status, description excerpt
  6. `confirm_deletion` - AskUserQuestion Yes/No
  7. `delete_task` - Run delete-task script
  8. `commit` - `git commit -m "docs({id}): delete - {title}"`
  9. `output_result` - Success message with commit hash
- [ ] Add `<success_criteria>` section
- [ ] Add `<example>` section

**Verify:** Skill follows conventions, all FRs addressed, partials used correctly

### Step 4: Final verification
- [ ] Build succeeds (if applicable)
- [ ] All acceptance criteria from task met
- [ ] Skill matches existing kanban-* skill conventions
- [ ] Script matches existing script conventions
- [ ] No regressions in workflow.yaml parsing

## Testing Strategy

- **Automated:** None required (skill/script are file-based, manual verification sufficient)
- **Manual:**
  - Create a test task in backlog, run `/kanban-delete`, confirm deletion
  - Try to delete a task in `scoped` status, verify error message
  - Run command from non-main branch, verify error message
  - Cancel confirmation, verify no changes
  - Verify commit message format in git log
- **Regression:** Verify existing kanban skills still work after workflow.yaml modification

## Edge Cases

- Task folder contains only task.md (no spec/plan) — delete should still succeed with recursive folder deletion
- Task folder contains additional unexpected files — recursive delete handles this
- Task ID doesn't exist — find-task.cjs returns error, skill shows error message
- User provides invalid task ID format — find-task.cjs returns error

## Potential Pitfalls

- **Partial deletion state** — Use `recursive: true, force: true` on rmSync to ensure complete deletion even if some files are missing
- **Git staging deleted files** — Use `git add -A .kanban/tasks/{id}/` or explicit `git rm -r` to stage the deletion correctly; alternatively `git add .kanban/tasks/{id}/task.md` won't work for deleted files, need to use `git rm`
- **Branch detection on Windows** — Use `git branch --show-current` which works cross-platform
