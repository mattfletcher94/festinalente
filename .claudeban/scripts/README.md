# Helper Scripts

Node.js helper scripts for reliable file discovery and formatting. These scripts are used by the LLM during kanban operations to avoid guessing filenames.

## Installation

Scripts are automatically installed to `.claude/scripts/` when you run:

```bash
npx claude-kanban@latest
```

## Scripts

### find-task.js

Find a task file by ID.

```bash
node .claude/scripts/find-task.js 003
```

**Success output:**
```json
{
  "id": "003",
  "filename": "003-add-password-reset.md",
  "path": ".kanban/tasks/003-add-password-reset.md",
  "title": "Add password reset",
  "status": "planned",
  "priority": "medium",
  "labels": ["feature"]
}
```

**Error output:**
```json
{
  "error": true,
  "message": "Task 003 not found in .kanban/tasks/"
}
```

---

### find-spec.js

Find a spec file by task ID.

```bash
node .claude/scripts/find-spec.js 003
```

**Success output:**
```json
{
  "id": "003",
  "filename": "003-add-password-reset.spec.md",
  "path": ".kanban/specs/003-add-password-reset.spec.md",
  "task": "003",
  "created": "2026-02-14",
  "updated": "2026-02-14"
}
```

**Error output:**
```json
{
  "error": true,
  "message": "Spec for task 003 not found in .kanban/specs/"
}
```

---

### find-plan.js

Find a plan file by task ID.

```bash
node .claude/scripts/find-plan.js 003
```

**Success output:**
```json
{
  "id": "003",
  "filename": "003-add-password-reset.plan.md",
  "path": ".kanban/plans/003-add-password-reset.plan.md",
  "task": "003",
  "spec": "specs/003-add-password-reset.spec.md",
  "status": "approved",
  "iteration": 1
}
```

**Error output:**
```json
{
  "error": true,
  "message": "Plan for task 003 not found in .kanban/plans/"
}
```

---

### list-tasks.js

List all tasks with optional filtering.

```bash
# List all tasks
node .claude/scripts/list-tasks.js

# Filter by status
node .claude/scripts/list-tasks.js --status=planned

# Filter by label
node .claude/scripts/list-tasks.js --label=bug

# Filter by priority
node .claude/scripts/list-tasks.js --priority=high

# Combine filters
node .claude/scripts/list-tasks.js --status=backlog --label=feature
```

**Success output:**
```json
{
  "count": 3,
  "tasks": [
    {
      "id": "001",
      "filename": "001-add-oauth-login.md",
      "path": ".kanban/tasks/001-add-oauth-login.md",
      "title": "Add OAuth login",
      "status": "done",
      "priority": "high",
      "labels": ["feature"]
    },
    {
      "id": "002",
      "filename": "002-fix-session-timeout.md",
      "path": ".kanban/tasks/002-fix-session-timeout.md",
      "title": "Fix session timeout",
      "status": "in-progress",
      "priority": "medium",
      "labels": ["bug"]
    }
  ]
}
```

---

### next-id.js

Get the next available task ID.

```bash
node .claude/scripts/next-id.js
```

**Output:**
```json
{
  "nextId": "004",
  "currentHighest": "003",
  "padding": 3
}
```

---

### get-date-time.js

Get formatted date-time strings.

```bash
node .claude/scripts/get-date-time.js
```

**Output:**
```json
{
  "iso": "2026-02-14T15:30:45.123Z",
  "date": "2026-02-14"
}
```

## Error Handling

All scripts return JSON output. On error, the output includes:

```json
{
  "error": true,
  "message": "Description of what went wrong"
}
```

The process exit code will be 1 on error, 0 on success.

## No Dependencies

These scripts use only Node.js built-in modules (`fs`, `path`). No npm dependencies required.
