## Helper Scripts

Use these scripts to reliably find files:

```bash
# Find task by ID (returns JSON with path and metadata)
node .claude/scripts/find-task.cjs {id}

# Find spec by ID (returns JSON with path)
node .claude/scripts/find-spec.cjs {id}

# Find plan by ID (returns JSON with path)
node .claude/scripts/find-plan.cjs {id}

# Get current date/time (returns JSON with iso and date formats)
node .claude/scripts/get-date-time.cjs
```