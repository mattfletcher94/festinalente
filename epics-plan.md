# Plan: Epics

## Overview

Epics enable grouping of related tasks with shared context. When Claude works on a task in an epic, it loads the epic's decisions, patterns, and technical context automatically.

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Epic IDs | Sequential: E001, E002 (consistent with task IDs) |
| Breakdown dependencies | Yes, track `depends="1,2"` (LLM-friendly, explicit sequencing) |
| Epic research depth | Heavy (full architecture, DB schema, API contracts - like kanban-scope) |
| Epic statuses | `active` and `completed` only |
| Epic management skill | Skip for v1 (no `/kanban-epic` command) |
| Epic completion | Manual (user edits epic.xml to set status="completed") |
| Commit messages | Epic files: `docs(E001): create - Title`. Tasks: unchanged (use task ID) |
| Standalone tasks | No epic question - `/kanban-create "title"` works exactly as today |

---

## Epic Structure

**Runtime Location:** `.kanban/epics/E001.xml`

```xml
<epic id="E001" status="active" created="2026-02-24" updated="2026-02-24">
  <title>User Authentication System</title>

  <problem>
    Users currently can't create accounts or log in. The app is
    single-user with no persistence. We need multi-user support
    with secure authentication to launch publicly.
  </problem>

  <goals>
    <goal>Users can create accounts and log in securely</goal>
    <goal>Sessions persist across browser refresh</goal>
    <goal>Foundation for future features (teams, permissions)</goal>
  </goals>

  <users>
    <user type="new-user">Signs up, creates account, starts using app</user>
    <user type="returning-user">Logs in, resumes where they left off</user>
    <user type="forgot-password">Resets password via email</user>
  </users>

  <scope>
    <in>
      <item>Email/password registration</item>
      <item>Login/logout</item>
      <item>Session management</item>
      <item>Password reset via email</item>
    </in>
    <out>
      <item>OAuth/social login (future epic)</item>
      <item>Two-factor authentication (future epic)</item>
      <item>User roles/permissions (future epic)</item>
    </out>
  </scope>

  <research>
    <finding type="existing">
      User model exists at src/models/user.ts but only has
      name/email, no password field
    </finding>
    <finding type="pattern">
      API routes follow REST pattern in src/routes/, use
      middleware chain from src/middleware/
    </finding>
    <finding type="pattern">
      Error handling uses AppError class from src/utils/errors.ts
    </finding>
    <finding type="dependency">
      Already using express-session but not configured
    </finding>
    <finding type="constraint">
      PostgreSQL database, migrations in src/db/migrations/
    </finding>
  </research>

  <decisions>
    <decision date="2026-02-24" reason="stateless scaling">
      Use JWT tokens instead of server sessions
    </decision>
    <decision date="2026-02-24" reason="security best practice">
      Store JWT in httpOnly cookie, not localStorage
    </decision>
    <decision date="2026-02-24" reason="existing pattern">
      Auth service at src/services/auth/ following existing service pattern
    </decision>
    <decision date="2026-02-24" reason="security">
      bcrypt for password hashing, 12 rounds
    </decision>
    <decision date="2026-02-24" reason="UX balance">
      24 hour session expiry with refresh token
    </decision>
  </decisions>

  <technical>
    <architecture>
      src/
      ├── services/auth/
      │   ├── index.ts        # Main auth service
      │   ├── jwt.ts          # Token generation/validation
      │   └── password.ts     # Hashing utilities
      ├── routes/auth/
      │   ├── register.ts
      │   ├── login.ts
      │   └── logout.ts
      └── middleware/
          └── requireAuth.ts  # Protected route middleware
    </architecture>

    <interfaces>
      POST /api/auth/register { email, password } → { user, token }
      POST /api/auth/login { email, password } → { user, token }
      POST /api/auth/logout → { success }
      POST /api/auth/reset-password { email } → { success }
      POST /api/auth/reset-password/:token { password } → { success }
    </interfaces>

    <database>
      -- Users table changes needed
      ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
      ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;

      -- New tokens table
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        token VARCHAR(255),
        expires_at TIMESTAMP
      );
    </database>
  </technical>

  <risks>
    <risk severity="high" mitigation="Use established libraries (bcrypt, jsonwebtoken)">
      Security vulnerabilities in auth implementation
    </risk>
    <risk severity="medium" mitigation="Feature flag for gradual rollout">
      Breaking existing user sessions during migration
    </risk>
    <risk severity="low" mitigation="Rate limiting on auth endpoints">
      Brute force attacks
    </risk>
  </risks>

  <acceptance>
    <criterion>User can register with valid email/password</criterion>
    <criterion>User cannot register with existing email</criterion>
    <criterion>User can log in with correct credentials</criterion>
    <criterion>User cannot log in with wrong password</criterion>
    <criterion>Session persists across page refresh</criterion>
    <criterion>User can log out, session invalidated</criterion>
    <criterion>Password reset email sends correctly</criterion>
    <criterion>Password reset link works once, expires after 1 hour</criterion>
  </acceptance>

  <breakdown>
    <item id="1" status="pending">
      Set up auth service structure and JWT utilities
    </item>
    <item id="2" status="pending" depends="1">
      Add password field to user model, create migration
    </item>
    <item id="3" status="pending" depends="2">
      Implement registration endpoint
    </item>
    <item id="4" status="pending" depends="3">
      Implement login endpoint
    </item>
    <item id="5" status="pending" depends="4">
      Implement logout and requireAuth middleware
    </item>
    <item id="6" status="pending" depends="5">
      Implement password reset flow
    </item>
  </breakdown>
</epic>
```

---

## Task ↔ Epic Relationship

### Task references epic:

```xml
<task id="016">
  <epic>E001</epic>
  <title>Implement user registration</title>
  <!-- rest of task fields -->
</task>
```

### Breakdown item updated when task created:

```xml
<item id="3" status="created" task="016" depends="2">
  Implement registration endpoint
</item>
```

---

## Workflow

### 1. Create Epic: `/kanban-create-epic "User Authentication"`

**Process:**
1. Q&A to capture problem, goals, users, scope (in/out)
2. Deep codebase research (like kanban-scope):
   - Product docs search
   - Engineering patterns search
   - Codebase architecture analysis
   - Pitfall detection
3. Present synthesis to user
4. Resolve decisions (technical choices with rationale)
5. Define technical details (architecture, interfaces, database)
6. Identify risks with mitigations
7. Define epic-level acceptance criteria
8. Propose breakdown items with dependencies
9. User approves/adjusts
10. Generate next epic ID via `next-epic-id.cjs`
11. Create `.kanban/epics/E001.xml`
12. Commit: `docs(E001): create - {title}`

**Output:** Epic with full context and breakdown, no tasks yet.

### 2. Create Task from Epic: `/kanban-create E001`

**Process:**
1. Load epic via `find-epic.cjs`
2. Show breakdown items with status:
   ```
   1. ✓ Set up auth service (task 015)
   2. → Add password field (available, depends on 1 ✓)
   3. ○ Registration (blocked by 2)
   ```
3. User selects available item
4. Load epic context (decisions, technical, patterns)
5. Use context to pre-fill and enrich Q&A:
   - Problem context from epic
   - Technical approach from epic.technical
   - Patterns from epic.research
6. Create full-quality task with `<epic>E001</epic>`
7. Update breakdown item: `status="created" task="016"`
8. Commit task and epic update

**Output:** Task with epic reference, breakdown item updated.

### 3. Work on Task: `/kanban-scope 016`, `/kanban-plan 016`, etc.

**Process:**
1. Read task, detect `<epic>E001</epic>` field
2. If epic field exists:
   - Load epic via `find-epic.cjs`
   - Store epic context (decisions, technical, research)
   - List other tasks in epic via `list-tasks.cjs --epic=E001`
   - Note completed tasks for reference
3. If no epic field:
   - Skip entirely, proceed as today
4. Continue with normal skill flow, referencing epic context where relevant

**Key:** Epic context is additive. Without epic, skills work exactly as today.

---

## Build System Notes

Scripts are TypeScript files in `apps/kanban/src/scripts/` that get compiled to CJS via tsdown and deployed to `.kanban/scripts/` at runtime.

**Build command in `apps/kanban/package.json`:**
```json
{
  "scripts": {
    "build:scripts": "tsdown -c tsdown.config.ts src/scripts/find-task.ts ... src/scripts/find-epic.ts src/scripts/list-epics.ts src/scripts/next-epic-id.ts --format cjs --out-dir dist/scripts"
  }
}
```

Partials in `apps/kanban/src/content/partials/` get compiled at build time with Handlebars.

---

## New Scripts (Source Files)

### apps/kanban/src/scripts/next-epic-id.ts

Generates next epic ID (E001, E002, etc.)

**Usage (after build):**
```bash
node .kanban/scripts/next-epic-id.cjs

{ "id": "E003", "path": ".kanban/epics/E003.xml" }
```

**Implementation:**
```typescript
#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const EPICS_DIR = '.kanban/epics';

function main(): void {
  if (!fs.existsSync(EPICS_DIR)) {
    // No epics directory yet, start at E001
    console.log(JSON.stringify({ id: 'E001', path: `${EPICS_DIR}/E001.xml` }));
    return;
  }

  const files = fs.readdirSync(EPICS_DIR)
    .filter(f => f.match(/^E\d+\.xml$/));

  if (files.length === 0) {
    console.log(JSON.stringify({ id: 'E001', path: `${EPICS_DIR}/E001.xml` }));
    return;
  }

  const numbers = files.map(f => parseInt(f.slice(1, -4), 10));
  const maxNum = Math.max(...numbers);
  const nextId = `E${String(maxNum + 1).padStart(3, '0')}`;

  console.log(JSON.stringify({
    id: nextId,
    path: `${EPICS_DIR}/${nextId}.xml`
  }));
}

main();
```

### apps/kanban/src/scripts/find-epic.ts

Find epic by ID, return path and parsed metadata.

**Usage (after build):**
```bash
node .kanban/scripts/find-epic.cjs E001

{
  "found": true,
  "path": ".kanban/epics/E001.xml",
  "id": "E001",
  "title": "User Authentication",
  "status": "active",
  "created": "2026-02-24",
  "taskCount": 2,
  "breakdown": {
    "total": 6,
    "pending": 4,
    "created": 2
  }
}
```

**Implementation:**
```typescript
#!/usr/bin/env node
import fs from 'fs';
import { parseEpicXml } from './lib/xml-parser';

const EPICS_DIR = '.kanban/epics';

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-epic.cjs <epicId>' }));
    process.exit(1);
  }

  const epicId = args[0];
  const epicPath = `${EPICS_DIR}/${epicId}.xml`;

  if (!fs.existsSync(epicPath)) {
    console.log(JSON.stringify({
      found: false,
      error: true,
      message: `Epic ${epicId} not found`
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(epicPath, 'utf8');
  const parsed = parseEpicXml(content);

  // Count tasks with this epic
  const tasksDir = '.kanban/tasks';
  let taskCount = 0;
  if (fs.existsSync(tasksDir)) {
    const taskFolders = fs.readdirSync(tasksDir, { withFileTypes: true })
      .filter(f => f.isDirectory());
    for (const folder of taskFolders) {
      const taskXml = `${tasksDir}/${folder.name}/task.xml`;
      if (fs.existsSync(taskXml)) {
        const taskContent = fs.readFileSync(taskXml, 'utf8');
        if (taskContent.includes(`<epic>${epicId}</epic>`)) {
          taskCount++;
        }
      }
    }
  }

  console.log(JSON.stringify({
    found: true,
    path: epicPath.replace(/\\/g, '/'),
    id: parsed.id,
    title: parsed.title,
    status: parsed.status,
    created: parsed.created,
    taskCount,
    breakdown: parsed.breakdown
  }, null, 2));
}

main();
```

### apps/kanban/src/scripts/list-epics.ts

List all epics with status and counts.

**Usage (after build):**
```bash
node .kanban/scripts/list-epics.cjs
node .kanban/scripts/list-epics.cjs --status=active
```

**Implementation:**
```typescript
#!/usr/bin/env node
import fs from 'fs';
import { parseEpicXml } from './lib/xml-parser';

const EPICS_DIR = '.kanban/epics';

interface ParsedArgs {
  status?: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = {};
  for (const arg of args) {
    if (arg.startsWith('--status=')) {
      result.status = arg.slice(9);
    }
  }
  return result;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(EPICS_DIR)) {
    console.log(JSON.stringify({ count: 0, epics: [] }));
    return;
  }

  const files = fs.readdirSync(EPICS_DIR)
    .filter(f => f.match(/^E\d+\.xml$/))
    .sort();

  const epics = [];

  for (const file of files) {
    const epicPath = `${EPICS_DIR}/${file}`;
    const content = fs.readFileSync(epicPath, 'utf8');
    const parsed = parseEpicXml(content);

    if (args.status && parsed.status !== args.status) {
      continue;
    }

    epics.push({
      id: parsed.id,
      title: parsed.title,
      status: parsed.status,
      path: epicPath.replace(/\\/g, '/'),
      breakdown: parsed.breakdown
    });
  }

  console.log(JSON.stringify({ count: epics.length, epics }, null, 2));
}

main();
```

### apps/kanban/src/scripts/lib/xml-parser.ts (MODIFY)

Add epic parsing support and epic field to task parsing.

**Add to existing file:**
```typescript
// Add epic field to ParsedTask interface
export interface ParsedTask {
  id: string;
  status: string;
  priority: string;
  title: string;
  labels: string[];
  created: string;
  updated: string;
  epic?: string;  // NEW
}

// Update parseTaskXml to extract epic
export function parseTaskXml(content: string): ParsedTask {
  const result = parser.parse(content);
  const task = result.task;
  return {
    id: task.id || '',
    status: task.status || '',
    priority: task.priority || '',
    title: task.title || '',
    labels: Array.isArray(task.labels?.label) ? task.labels.label :
            task.labels?.label ? [task.labels.label] : [],
    created: task.created || '',
    updated: task.updated || '',
    epic: task.epic || undefined,  // NEW
  };
}

// NEW: Epic parsing
export interface ParsedEpicBreakdown {
  total: number;
  pending: number;
  created: number;
  items: Array<{
    id: string;
    status: string;
    description: string;
    taskId?: string;
    depends?: string;
  }>;
}

export interface ParsedEpic {
  id: string;
  status: string;
  title: string;
  created: string;
  updated: string;
  breakdown: ParsedEpicBreakdown;
}

export function parseEpicXml(content: string): ParsedEpic {
  const result = parser.parse(content);
  const epic = result.epic;

  // Parse breakdown items
  const breakdownItems = epic.breakdown?.item || [];
  const items = (Array.isArray(breakdownItems) ? breakdownItems : [breakdownItems])
    .filter(Boolean)
    .map((item: any) => ({
      id: item.id || '',
      status: item.status || 'pending',
      description: item._text || item || '',
      taskId: item.task || undefined,
      depends: item.depends || undefined,
    }));

  const pending = items.filter((i: any) => i.status === 'pending').length;
  const created = items.filter((i: any) => i.status === 'created').length;

  return {
    id: epic.id || '',
    status: epic.status || 'active',
    title: epic.title || '',
    created: epic.created || '',
    updated: epic.updated || '',
    breakdown: {
      total: items.length,
      pending,
      created,
      items,
    },
  };
}
```

### apps/kanban/src/scripts/list-tasks.ts (MODIFY)

Add `--epic=E001` filter to existing script.

**Add to existing file:**
```typescript
// In ParsedArgs interface, add:
interface ParsedArgs {
  // ... existing fields ...
  epic?: string;  // NEW
}

// In parseArgs function, add handling:
if (arg.startsWith('--epic=')) {
  result.epic = arg.slice(7);
}

// In main function, add filter after other filters:
if (args.epic) {
  const taskContent = fs.readFileSync(filePath, 'utf8');
  if (!taskContent.includes(`<epic>${args.epic}</epic>`)) continue;
}
```

---

## Update package.json Build Command

**File:** `apps/kanban/package.json`

Add new scripts to the build:scripts command:

```json
{
  "scripts": {
    "build:scripts": "tsdown -c tsdown.config.ts src/scripts/find-task.ts src/scripts/find-spec.ts src/scripts/find-plan.ts src/scripts/list-tasks.ts src/scripts/next-id.ts src/scripts/get-date-time.ts src/scripts/list-product.ts src/scripts/search-product.ts src/scripts/check-product.ts src/scripts/get-hook-config.ts src/scripts/search-engineering.ts src/scripts/list-engineering.ts src/scripts/check-engineering.ts src/scripts/validate-yaml.ts src/scripts/delete-task.ts src/scripts/search-hybrid.ts src/scripts/select-context.ts src/scripts/check-freshness.ts src/scripts/validate-docs.ts src/scripts/expand-query.ts src/scripts/validate-xml.ts src/scripts/validate-directive.ts src/scripts/get-skill-config.ts src/scripts/find-epic.ts src/scripts/list-epics.ts src/scripts/next-epic-id.ts --format cjs --out-dir dist/scripts"
  }
}
```

---

## Helper Scripts Partial Update

**File:** `apps/kanban/src/content/partials/helper-scripts.md`

Add epic scripts (append to existing content):

```markdown
{{#if show_find_epic}}
<command description="Find epic by ID (returns JSON with path and metadata)">node .kanban/scripts/find-epic.cjs {epicId}</command>
{{/if}}

{{#if show_list_epics}}
<command description="List all epics (returns JSON with count and epics array)">node .kanban/scripts/list-epics.cjs</command>
<command description="List epics filtered by status">node .kanban/scripts/list-epics.cjs --status=active</command>
{{/if}}

{{#if show_next_epic_id}}
<command description="Get next epic ID (returns JSON with id and path)">node .kanban/scripts/next-epic-id.cjs</command>
{{/if}}

{{#if show_list_tasks_epic}}
<command description="List tasks filtered by epic">node .kanban/scripts/list-tasks.cjs --epic=E001</command>
{{/if}}
```

---

## New Partial

### apps/kanban/src/content/partials/load-epic-context.md

```markdown
{{#if task_has_epic}}
<step name="load_epic_context">
  <command>node .kanban/scripts/find-epic.cjs {{task_epic}}</command>
  <branch condition="epic found">
    <output>Loading epic context: {{epic.title}}</output>
    <action>Read epic.xml at returned path</action>
    <action>Store for reference:
      - epic.decisions (key choices made)
      - epic.technical (architecture, interfaces, database)
      - epic.research (codebase findings)
      - epic.acceptance (epic-level criteria)
    </action>
    <command>node .kanban/scripts/list-tasks.cjs --epic={{task_epic}}</command>
    <action>Note completed tasks in epic for prior work reference</action>
  </branch>
  <branch condition="epic not found">
    <output>Warning: Epic {{task_epic}} not found, proceeding without context</output>
  </branch>
</step>
{{/if}}
```

**Key behavior:**
- `{{#if task_has_epic}}` conditional means the entire step is omitted if no epic
- No output, no changes when epic doesn't exist
- Existing behavior completely unchanged for non-epic tasks

---

## New Skill: kanban-create-epic

**File:** `apps/kanban/src/content/skills/kanban-create-epic/SKILL.md`

**Frontmatter:**
```yaml
---
name: kanban-create-epic
description: Create an epic through Socratic Q&A, research, and task breakdown
allowed-tools: Read, Write, Bash(ls *, git add *, git commit *), Glob, Grep, AskUserQuestion, Task
argument-hint: '"Epic title"'
disable-model-invocation: true
---
```

**Process outline (Socratic Q&A approach like kanban-create):**

1. `load_workflow` - Load workflow.yaml
2. `verify_branch` - Must be on main (use `{{> branch-verify-main}}`)
3. `get_title` - From arguments or ask

**Phase 1: Understand the Problem (Socratic Q&A)**

4. `problem_qa` - Iterative dialogue to understand:
   - What pain point are we solving?
   - Who experiences this pain?
   - What's the impact of not solving it?
   - Use AskUserQuestion for clarifications

5. `goals_qa` - Iterative dialogue to define:
   - What does success look like?
   - How will we measure it?
   - What are the must-haves vs nice-to-haves?

6. `users_qa` - Iterative dialogue to identify:
   - Who are the primary users?
   - What are their key workflows?
   - Any edge case users?

7. `scope_qa` - Iterative dialogue to bound:
   - What's definitely in scope?
   - What's explicitly out of scope?
   - What's deferred to future epics?

**Phase 2: Research (like kanban-scope)**

8. `deep_research` - Parallel agents:
   - Product context researcher
   - Engineering pattern finder
   - Codebase analyzer
   - Pitfall detector

9. `synthesize_research` - Combine findings, present to user with AskUserQuestion:
   - "Does this synthesis look complete?"
   - Options: Looks complete / Explore more

**Phase 3: Technical Decisions (Socratic Q&A)**

10. `resolve_decisions` - For each decision point from research:
    - Present options with trade-offs via AskUserQuestion
    - Record decision with rationale

11. `define_technical` - Based on decisions, define:
    - Architecture (file structure)
    - Interfaces (API contracts)
    - Database (schema changes)

12. `identify_risks` - Present potential risks:
    - User confirms severity
    - User confirms mitigation approach

**Phase 4: Breakdown**

13. `define_acceptance` - Epic-level done criteria

14. `propose_breakdown` - Suggest task breakdown:
    - Present via AskUserQuestion
    - User can adjust, add, remove items
    - Identify dependencies between items

**Phase 5: Create**

15. `generate_id` - Get next epic ID via script
16. `create_epics_dir` - Create `.kanban/epics/` if not exists
17. `write_epic` - Create E001.xml with all gathered info
18. `commit` - `docs(E001): create - {title}`

**Key difference from kanban-create:** More extensive Q&A phases because epic covers broader scope. Uses iterative AskUserQuestion throughout to ensure alignment.

---

## Skill Modifications

### apps/kanban/src/content/skills/kanban-create/SKILL.md

**Changes:**
1. Parse arguments to detect epic ID (E001 pattern)
2. If epic ID provided:
   - Load epic via `find-epic.cjs`
   - Show available breakdown items
   - User selects item
   - Pre-fill task context from epic
   - Include `<epic>E001</epic>` in task.xml
   - Update breakdown item status in epic.xml
3. If no epic ID:
   - Proceed exactly as today (no changes)

**Key addition to argument parsing:**
```xml
<step name="parse_arguments" outputs="epicId, title">
  <branch condition="first argument matches E### pattern">
    <command>node .kanban/scripts/find-epic.cjs {arg}</command>
    <branch condition="epic found">
      <action>Set epicId = argument</action>
      <action>Proceed to epic task creation flow</action>
    </branch>
    <branch condition="epic not found">
      <output>Epic {arg} not found. Create it with /kanban-create-epic</output>
      <action>Exit</action>
    </branch>
  </branch>
  <branch condition="argument does not match E### pattern">
    <action>Proceed with normal task creation (no epic)</action>
  </branch>
</step>
```

### apps/kanban/src/content/skills/kanban-scope/SKILL.md

**Changes:**
1. After reading task, add `{{> load-epic-context}}`
2. In research step, reference epic context if loaded:
   - Use epic.research as starting point
   - Respect epic.decisions (don't re-decide)
   - Follow epic.technical patterns
3. If no epic, research from scratch (unchanged)

### apps/kanban/src/content/skills/kanban-plan/SKILL.md

**Changes:**
1. After reading task, add `{{> load-epic-context}}`
2. In planning, reference epic context:
   - Follow architecture from epic.technical
   - Reference interfaces defined in epic
   - Note prior tasks' implementations
3. If no epic, plan from scratch (unchanged)

### apps/kanban/src/content/skills/kanban-implement/SKILL.md

**Changes:**
1. After loading context, add `{{> load-epic-context}}`
2. Before implementation, reference epic context:
   - Decisions (JWT approach, patterns, etc.)
   - What prior tasks built
   - Interfaces to implement
3. If no epic, implement as today (unchanged)

### apps/kanban/src/content/skills/kanban-check/SKILL.md

**Changes:**
1. After loading task, add `{{> load-epic-context}}`
2. During verification, optionally reference epic.acceptance for broader context
3. If no epic, check as today (unchanged)

### apps/kanban/src/content/skills/kanban-docs/SKILL.md

**Changes:**
1. After loading task, add `{{> load-epic-context}}`
2. Use epic context for documentation:
   - Reference epic.problem for feature context
   - Reference epic.technical for architecture docs
3. If no epic, docs as today (unchanged)

### apps/kanban/src/content/skills/kanban-overview/SKILL.md

**Changes:**
1. When listing tasks, show epic grouping:
   ```
   Epic E001: User Authentication (2/6)
   - 015: Set up auth service [done]
   - 016: Implement registration [in-progress]

   Standalone Tasks:
   - 017: Fix typo [backlog]
   ```
2. Include epic summary in overview output
3. If no epics exist, show tasks as today (unchanged)

---

## Template Updates

### apps/kanban/src/content/templates/task.xml (MODIFY)

Add optional epic field after id:

```xml
<task id="{id}">
  <epic>{epicId}</epic>  <!-- NEW: Optional, only present for epic tasks -->
  <status>{status}</status>
  <!-- ... rest unchanged ... -->
</task>
```

### apps/kanban/src/content/templates/epic.xml (NEW)

**File:** `apps/kanban/src/content/templates/epic.xml`

```xml
<epic id="{id}" status="active" created="{date}" updated="{date}">
  <title>{title}</title>

  <problem>
    {Describe the pain point being solved}
  </problem>

  <goals>
    <goal>{Measurable outcome}</goal>
  </goals>

  <users>
    <user type="{user-type}">{User story}</user>
  </users>

  <scope>
    <in>
      <item>{What's included}</item>
    </in>
    <out>
      <item>{What's excluded - future work}</item>
    </out>
  </scope>

  <research>
    <finding type="existing|pattern|constraint|dependency">
      {Codebase finding}
    </finding>
  </research>

  <decisions>
    <decision date="{YYYY-MM-DD}" reason="{rationale}">
      {The technical decision}
    </decision>
  </decisions>

  <technical>
    <architecture>
      {File/folder structure}
    </architecture>

    <interfaces>
      {API contracts}
    </interfaces>

    <database>
      {Schema changes if any}
    </database>
  </technical>

  <risks>
    <risk severity="high|medium|low" mitigation="{how to address}">
      {The risk}
    </risk>
  </risks>

  <acceptance>
    <criterion>{Epic-level done criterion}</criterion>
  </acceptance>

  <breakdown>
    <item id="1" status="pending">
      {Task description}
    </item>
    <item id="2" status="pending" depends="1">
      {Task description - depends on item 1}
    </item>
  </breakdown>
</epic>
```

---

## VSCode Extension Changes

### apps/vscode/src/types/task-types.ts (MODIFY)

Add epic field to Task interface:

```typescript
export interface Task {
  id: string;
  status: TaskStatus;
  priority: string;
  title: string;
  labels: string[];
  created: string;
  updated: string;
  taskPath: string;
  epic?: string;  // NEW: Optional epic reference
}
```

### apps/vscode/src/computers/task-parser.computer.ts (MODIFY)

Add epic extraction:

```typescript
// In parseTaskWithPath function, add:
const epicMatch = content.match(/<epic>([^<]+)<\/epic>/);

// In return object, add:
epic: epicMatch ? epicMatch[1] : undefined,
```

### apps/vscode/src/capabilities/tasks-view.capability.ts (MODIFY)

Show epic indicator in task label:

```typescript
// In TaskItem.getTreeItem() or description, add:
if (this.task.epic) {
  // Prepend epic indicator to description
  description = `[${this.task.epic}] ${description}`;
}
```

**Result:** Tasks show as `[E001] 016: Implement registration #feature`

### apps/vscode/src/computers/epic-parser.computer.ts (NEW)

```typescript
/**
 * Epic Parser Computer
 * Pure function to parse epic.xml content into structured data.
 */

interface BreakdownItem {
  id: string;
  status: 'pending' | 'created';
  description: string;
  taskId?: string;
  depends?: string[];
}

interface Epic {
  id: string;
  title: string;
  status: 'active' | 'completed';
  created: string;
  updated: string;
  path: string;
  breakdown: BreakdownItem[];
}

export function createEpicParserComputer() {
  function parseEpic(content: string, epicPath: string): Epic {
    // Parse XML using regex (consistent with task parser)
    const idMatch = content.match(/<epic[^>]*\s+id="([^"]+)"/);
    const statusMatch = content.match(/<epic[^>]*\s+status="([^"]+)"/);
    const titleMatch = content.match(/<title>([^<]+)<\/title>/);
    const createdMatch = content.match(/<epic[^>]*\s+created="([^"]+)"/);
    const updatedMatch = content.match(/<epic[^>]*\s+updated="([^"]+)"/);

    // Parse breakdown items
    const breakdownItems: BreakdownItem[] = [];
    const itemRegex = /<item\s+id="(\d+)"(?:\s+status="([^"]+)")?(?:\s+task="([^"]+)")?(?:\s+depends="([^"]+)")?[^>]*>([^<]*)<\/item>/g;
    let match;
    while ((match = itemRegex.exec(content)) !== null) {
      breakdownItems.push({
        id: match[1],
        status: (match[2] as 'pending' | 'created') || 'pending',
        taskId: match[3] || undefined,
        depends: match[4] ? match[4].split(',') : undefined,
        description: match[5].trim(),
      });
    }

    return {
      id: idMatch?.[1] || '',
      title: titleMatch?.[1] || '',
      status: (statusMatch?.[1] as 'active' | 'completed') || 'active',
      created: createdMatch?.[1] || '',
      updated: updatedMatch?.[1] || '',
      path: epicPath,
      breakdown: breakdownItems,
    };
  }

  return { parseEpic };
}
```

### apps/vscode/src/capabilities/epics-view.capability.ts (NEW)

New TreeDataProvider for epics section with header actions.

```typescript
/**
 * Epics View Capability
 * TreeDataProvider showing epics with breakdown items and linked tasks.
 */

import * as vscode from 'vscode';
import * as path from 'path';

interface EpicsViewDependencies {
  loadEpics: () => Epic[];
  loadTasksForEpic: (epicId: string) => Task[];
}

// EpicItem - collapsible epic showing title and progress
class EpicItem extends vscode.TreeItem {
  constructor(public readonly epic: Epic, public readonly tasks: Task[]) {
    super(
      `${epic.id}: ${epic.title}`,
      vscode.TreeItemCollapsibleState.Collapsed
    );
    const created = epic.breakdown.filter(b => b.status === 'created').length;
    const total = epic.breakdown.length;
    this.description = `(${created}/${total})`;
    this.iconPath = new vscode.ThemeIcon('package');
    this.contextValue = 'epic';
  }
}

// EpicTaskItem - task belonging to epic
class EpicTaskItem extends vscode.TreeItem {
  constructor(public readonly task: Task) {
    super(`${task.id}: ${task.title}`, vscode.TreeItemCollapsibleState.None);
    // Set icon based on status
    const iconMap: Record<string, string> = {
      'done': 'check',
      'in-progress': 'debug-start',
      'planned': 'circle-outline',
    };
    this.iconPath = new vscode.ThemeIcon(iconMap[task.status] || 'circle-outline');
    this.command = {
      command: 'kanban.openFile',
      title: 'Open Task',
      arguments: [{ filePath: path.join(task.taskPath, 'task.xml') }]
    };
  }
}

// EpicPendingItem - breakdown item not yet created as task
class EpicPendingItem extends vscode.TreeItem {
  constructor(public readonly item: BreakdownItem, public readonly epicId: string) {
    super(`Item ${item.id}: ${item.description}`, vscode.TreeItemCollapsibleState.None);
    this.iconPath = new vscode.ThemeIcon('circle-outline');
    this.description = item.depends ? `depends: ${item.depends.join(',')}` : '';
    this.contextValue = 'epicPendingItem';
  }
}

export function createEpicsViewCapability(deps: EpicsViewDependencies) {
  // ... TreeDataProvider implementation following existing patterns
}
```

### apps/vscode/package.json (MODIFY)

Add epics view and commands:

```json
{
  "contributes": {
    "views": {
      "kanban": [
        { "id": "kanbanTasks", "name": "Kanban Tasks" },
        { "id": "kanbanConfig", "name": "Kanban Config" },
        { "id": "kanbanEpics", "name": "Epics" },
        { "id": "kanbanProductDocs", "name": "Product Docs" },
        { "id": "kanbanEngineeringDocs", "name": "Engineering Docs" }
      ]
    },
    "commands": [
      {
        "command": "kanban.createEpic",
        "title": "Kanban: Create Epic",
        "icon": "$(add)"
      },
      {
        "command": "kanban.refreshEpics",
        "title": "Kanban: Refresh Epics",
        "icon": "$(refresh)"
      }
    ],
    "menus": {
      "view/title": [
        {
          "command": "kanban.createEpic",
          "when": "view == kanbanEpics",
          "group": "navigation@1"
        },
        {
          "command": "kanban.refreshEpics",
          "when": "view == kanbanEpics",
          "group": "navigation@2"
        }
      ]
    }
  }
}
```

### apps/vscode/src/extension.ts (MODIFY)

Add epics view registration and watcher:

```typescript
// Import new capability
import { createEpicsViewCapability } from './capabilities/epics-view.capability';
import { createEpicParserComputer } from './computers/epic-parser.computer';

// In activate function:

// Initialize epic parser
const epicParser = createEpicParserComputer();

// Policy: Load all epics
function loadAllEpics(): Epic[] {
  const epicsDir = fs.joinPath(kanbanDir, 'epics');
  if (!fs.exists(epicsDir)) {
    return [];
  }
  const files = fs.readDir(epicsDir).filter(f => f.match(/^E\d+\.xml$/));
  return files.map(file => {
    const epicPath = fs.joinPath(epicsDir, file);
    const content = fs.readFile(epicPath);
    return epicParser.parseEpic(content, epicPath);
  });
}

// Policy: Load tasks for epic
function loadTasksForEpic(epicId: string): Task[] {
  return loadAllTasks().filter(t => t.epic === epicId);
}

// Initialize epics view
const epicsView = createEpicsViewCapability({
  loadEpics: loadAllEpics,
  loadTasksForEpic,
});

const epicsTreeDataProvider = epicsView.createTreeDataProvider();
const refreshEpics = epicsView.createRefreshCallback();

// Register TreeView
const epicsTreeView = vscode.window.createTreeView('kanbanEpics', {
  treeDataProvider: epicsTreeDataProvider,
});
context.subscriptions.push(epicsTreeView);

// Create Epic command
context.subscriptions.push(
  vscode.commands.registerCommand('kanban.createEpic', () => {
    const kanbanTerminal = terminal.createFreshTerminal('Kanban', workspaceRoot);
    terminal.showTerminal(kanbanTerminal);
    terminal.sendCommand(kanbanTerminal, getClaudeCommand('/kanban-create-epic'));
  })
);

// Refresh Epics command
context.subscriptions.push(
  vscode.commands.registerCommand('kanban.refreshEpics', () => {
    refreshEpics();
  })
);

// Epics file watcher
const epicsWatcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(kanbanPath, 'epics/*.xml')
);
epicsWatcher.onDidChange(() => refreshEpics());
epicsWatcher.onDidCreate(() => refreshEpics());
epicsWatcher.onDidDelete(() => refreshEpics());
context.subscriptions.push(epicsWatcher);
```

---

## Directory Structure Summary

**Source files (what gets edited):**

```
apps/kanban/src/
├── scripts/
│   ├── lib/
│   │   └── xml-parser.ts      # MODIFY: Add parseEpicXml, epic field to ParsedTask
│   ├── find-epic.ts           # NEW
│   ├── list-epics.ts          # NEW
│   ├── next-epic-id.ts        # NEW
│   └── list-tasks.ts          # MODIFY: Add --epic filter
├── content/
│   ├── skills/
│   │   ├── kanban-create-epic/  # NEW
│   │   │   └── SKILL.md
│   │   ├── kanban-create/       # MODIFY
│   │   │   └── SKILL.md
│   │   ├── kanban-scope/        # MODIFY
│   │   │   └── SKILL.md
│   │   ├── kanban-plan/         # MODIFY
│   │   │   └── SKILL.md
│   │   ├── kanban-implement/    # MODIFY
│   │   │   └── SKILL.md
│   │   ├── kanban-check/        # MODIFY
│   │   │   └── SKILL.md
│   │   ├── kanban-docs/         # MODIFY
│   │   │   └── SKILL.md
│   │   └── kanban-overview/     # MODIFY
│   │       └── SKILL.md
│   ├── partials/
│   │   ├── helper-scripts.md    # MODIFY: Add epic scripts
│   │   └── load-epic-context.md # NEW
│   └── templates/
│       ├── task.xml             # MODIFY: Add optional epic field
│       └── epic.xml             # NEW
└── package.json                 # MODIFY: Add new scripts to build

apps/vscode/
├── src/
│   ├── types/
│   │   └── task-types.ts            # MODIFY: Add epic field
│   ├── computers/
│   │   ├── task-parser.computer.ts  # MODIFY: Extract epic
│   │   └── epic-parser.computer.ts  # NEW
│   ├── capabilities/
│   │   ├── tasks-view.capability.ts # MODIFY: Show epic indicator
│   │   └── epics-view.capability.ts # NEW
│   └── extension.ts                 # MODIFY: Register epics view
└── package.json                     # MODIFY: Add view and commands
```

**Runtime files (created after build/install):**

```
.kanban/
├── epics/                     # NEW directory
│   ├── E001.xml
│   └── E002.xml
├── tasks/
│   └── 016/
│       └── task.xml           # Contains <epic>E001</epic>
├── scripts/
│   ├── find-epic.cjs          # Built from find-epic.ts
│   ├── list-epics.cjs         # Built from list-epics.ts
│   ├── next-epic-id.cjs       # Built from next-epic-id.ts
│   └── list-tasks.cjs         # Modified version
└── templates/
    └── epic.xml               # Copied from source
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Create `apps/kanban/src/scripts/next-epic-id.ts`
- [ ] Create `apps/kanban/src/scripts/find-epic.ts`
- [ ] Create `apps/kanban/src/scripts/list-epics.ts`
- [ ] Modify `apps/kanban/src/scripts/list-tasks.ts` - add `--epic` filter
- [ ] Modify `apps/kanban/src/scripts/lib/xml-parser.ts` - add parseEpicXml, epic field
- [ ] Update `apps/kanban/package.json` - add new scripts to build:scripts
- [ ] Create `apps/kanban/src/content/templates/epic.xml`
- [ ] Build and verify scripts work: `pnpm build`

### Phase 2: Epic Creation Skill
- [ ] Create `apps/kanban/src/content/skills/kanban-create-epic/SKILL.md`
- [ ] Build and install: `pnpm build && npx claude-kanban`
- [ ] Test: `/kanban-create-epic "Test Epic"`

### Phase 3: Epic Context Partial
- [ ] Create `apps/kanban/src/content/partials/load-epic-context.md`
- [ ] Modify `apps/kanban/src/content/partials/helper-scripts.md`
- [ ] Build and verify partial compiles

### Phase 4: Skill Modifications
- [ ] Modify `apps/kanban/src/content/skills/kanban-create/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-scope/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-plan/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-implement/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-check/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-docs/SKILL.md`
- [ ] Modify `apps/kanban/src/content/skills/kanban-overview/SKILL.md`
- [ ] Modify `apps/kanban/src/content/templates/task.xml` - add epic field placeholder
- [ ] Build and install all skills
- [ ] Test: `/kanban-create E001` (create task from epic)
- [ ] Test: `/kanban-scope {taskId}` (verify epic context loads)

### Phase 5: VSCode Extension
- [ ] Modify `apps/vscode/src/types/task-types.ts` - add epic field
- [ ] Modify `apps/vscode/src/computers/task-parser.computer.ts` - extract epic
- [ ] Modify `apps/vscode/src/capabilities/tasks-view.capability.ts` - show epic indicator
- [ ] Create `apps/vscode/src/computers/epic-parser.computer.ts`
- [ ] Create `apps/vscode/src/capabilities/epics-view.capability.ts`
- [ ] Modify `apps/vscode/src/extension.ts` - register epics view, commands, watcher
- [ ] Modify `apps/vscode/package.json` - add view and commands
- [ ] Build extension: `cd apps/vscode && pnpm build`
- [ ] Test in VSCode: verify Epics section appears with [+] and refresh buttons

### Phase 6: Documentation
- [ ] Create `.kanban/product/tasks/epics.md`
- [ ] Update relevant skill documentation
- [ ] Update README if applicable

---

## Testing Scenarios

1. **Create epic:** `/kanban-create-epic "User Authentication"`
   - Verify epic.xml created in `.kanban/epics/E001.xml`
   - Verify breakdown items present with correct structure

2. **Create task from epic:** `/kanban-create E001`
   - Verify breakdown items shown with dependency status
   - Verify task created with `<epic>E001</epic>` field
   - Verify breakdown item updated with `task="016"` attribute

3. **Scope task with epic:** `/kanban-scope 016`
   - Verify epic context loaded (see output mention epic title)
   - Verify research references epic decisions

4. **Scope task without epic:** `/kanban-scope 017`
   - Verify no epic loading
   - Verify behavior identical to current

5. **VSCode tasks display:**
   - Verify `[E001]` prefix on tasks that have epic field
   - Verify non-epic tasks unchanged

6. **VSCode Epics section:**
   - Verify Epics collapsible appears in sidebar
   - Verify epics listed with title and progress (X/Y)
   - Verify [+] button runs `/kanban-create-epic`
   - Verify created tasks shown with status icons
   - Verify pending breakdown items shown
   - Verify refresh when epic files change

---

## Status

- [x] System analysis complete
- [x] Questions resolved
- [x] Detailed implementation plan with correct source paths
- [ ] Phase 1: Foundation
- [ ] Phase 2: Epic Creation Skill
- [ ] Phase 3: Epic Context Partial
- [ ] Phase 4: Skill Modifications
- [ ] Phase 5: VSCode Extension
- [ ] Phase 6: Documentation
