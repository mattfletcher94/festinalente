# PLAN: GitHub Integration Directive

## Status: Design Complete

## Context

**Festina Lente** is a spec-driven development framework for AI coding assistants (Claude Code, OpenCode). It uses XML files (task.xml, spec.xml, plan.xml) to guide LLMs through structured workflows via "skills" (slash commands like `/festina-create`, `/festina-merge`).

**Directives** are XML files that add rules to skills. They're loaded at runtime and the LLM follows them as requirements.

**Source files** are in `apps/festinalente/src/`. After changes, run `pnpm build` to compile to `.festinalente/` and `.claude/`.

## Prerequisites (Already Done)

- GitHub MCP server connected: `claude mcp add --transport http GitHub "https://api.githubcopilot.com/mcp" -H "Authorization: Bearer $GITHUB_TOKEN"`
- `GITHUB_TOKEN` in `.env` at project root
- MCP tools available: `mcp__GitHub__*`

## Problem Statement

Users want visibility into Festina tasks through GitHub's UI (Issues, PRs, Projects) while keeping the LLM-optimized XML format as the source of truth.

**Key constraints:**
- Bi-directional sync is hard (state can drift)
- Team workflows require PR approvals before merge
- Solution must be optional (directive-based, not core)

---

## Solution: GitHub Directive

A directive that modifies `festina-create` and `festina-merge` to integrate with GitHub Issues and PRs via MCP.

### Core Principles

1. **GitHub Issues** = Human-readable view of tasks
2. **GitHub PRs** = Code review and approval workflow
3. **State lives in GitHub** = No sync problems (LLM reads GitHub state each run)
4. **Stateless & resumable** = User can close terminal, run command again anytime

---

## How Directives Work (Background)

Understanding how directives integrate with skills is critical for this design.

### Directive Loading Flow

```
Skill starts (e.g., festina-merge)
    │
    ▼
load_directives step
    │
    ├── Run: node .festinalente/scripts/get-skill-config.cjs festina-merge
    ├── Returns: { directives: [{ name: "github", path: "...", exists: true }] }
    │
    └── For each directive where exists=true:
        ├── Read the XML file
        ├── <context> principles → Maintain as ongoing mindset
        └── <process> rules where phase="merge" → Follow as REQUIREMENTS
    │
    ▼
Skill executes its <process> steps
    │
    ├── LLM follows skill instructions
    ├── LLM ALSO follows directive rules (they are requirements)
    │
    ▼
directive_compliance step
    │
    └── Runs <validation> checks from directive
```

### Key Insight: Directives ADD, They Don't Replace

Directives add rules that the LLM must follow alongside the skill's own instructions. They don't automatically override skill behavior.

**To achieve override behavior**, directive rules must be explicit:
- "DO NOT perform X"
- "SKIP step Y"
- "INSTEAD OF Z, do W"

The LLM is smart enough to resolve these instructions and skip conflicting skill steps.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      User's config.yaml                              │
├─────────────────────────────────────────────────────────────────────┤
│  directives:                                                         │
│    festina-create:                                                   │
│      - design                                                        │
│      - github       ← Enables GitHub Issue creation                 │
│    festina-merge:                                                    │
│      - github       ← Enables PR workflow (replaces local merge)    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│              .festinalente/directives/github.xml                     │
├─────────────────────────────────────────────────────────────────────┤
│  • Issue creation/linking rules (additive)                          │
│  • PR workflow rules (replaces local merge)                         │
│  • Stateless state-machine for merge flow                           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     GitHub MCP Server                                │
├─────────────────────────────────────────────────────────────────────┤
│  Tools: create_issue, get_issue, create_pull_request,               │
│         pull_request_read, merge_pull_request, etc.                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Workflow: festina-create

### Festina-First (create locally, push to GitHub)

```
/festina-create "Add logout button"
    │
    ├── Create task.xml locally (existing behavior)
    │
    └── GitHub directive:
        ├── Create GitHub Issue
        │   └── Title: "Add logout button"
        │   └── Body: Raw XML content
        ├── Store github-issue="#123" on task
        └── Output: "Created GitHub Issue #123"
```

### GitHub-First (pull from existing issue)

```
/festina-create #456
    │
    └── GitHub directive:
        ├── Fetch Issue #456 from GitHub
        ├── Create task.xml from issue body
        ├── Store github-issue="#456" on task
        └── Continue normal festina-create flow
```

---

## Workflow: festina-merge (Stateless State Machine)

The directive makes festina-merge check GitHub state and prompt accordingly:

```
/festina-merge 001
       │
       ▼
   Read task.xml
   Check for github-issue and github-pr attributes
       │
       ▼
   ┌─────────────────────────────────────────────────────────────┐
   │                    STATE MACHINE                             │
   ├─────────────────────────────────────────────────────────────┤
   │                                                              │
   │  ┌──────────────────┐                                       │
   │  │ No PR exists     │                                       │
   │  └────────┬─────────┘                                       │
   │           │                                                  │
   │           ▼                                                  │
   │  • Push branch to origin                                    │
   │  • Create PR via MCP                                        │
   │    └── Body: "Closes #123" (links to issue)                │
   │  • Store github-pr="#456" on task                          │
   │  • Prompt user:                                             │
   │    ┌─────────────────────────────────────┐                 │
   │    │ PR #456 created. Waiting for review │                 │
   │    │                                     │                 │
   │    │ [1] Open in browser                 │                 │
   │    │ [2] Done for now                    │                 │
   │    └─────────────────────────────────────┘                 │
   │                                                              │
   │  ┌──────────────────┐                                       │
   │  │ PR pending review│                                       │
   │  └────────┬─────────┘                                       │
   │           │                                                  │
   │           ▼                                                  │
   │  • Check PR via MCP (approvals, checks)                    │
   │  • Prompt user:                                             │
   │    ┌─────────────────────────────────────┐                 │
   │    │ PR #456 awaiting review (1/2)       │                 │
   │    │                                     │                 │
   │    │ [1] Open in browser                 │                 │
   │    │ [2] Done for now                    │                 │
   │    └─────────────────────────────────────┘                 │
   │                                                              │
   │  ┌──────────────────┐                                       │
   │  │ PR approved ✓    │                                       │
   │  └────────┬─────────┘                                       │
   │           │                                                  │
   │           ▼                                                  │
   │  • Prompt user:                                             │
   │    ┌─────────────────────────────────────┐                 │
   │    │ PR #456 approved! Ready to merge.   │                 │
   │    │                                     │                 │
   │    │ [1] Merge now (recommended)         │                 │
   │    │ [2] Wait                            │                 │
   │    └─────────────────────────────────────┘                 │
   │           │                                                  │
   │           ▼ (if merge)                                      │
   │  • Merge PR via MCP                                        │
   │  • Issue #123 auto-closes (via "Closes #123")             │
   │  • Update task status → "done"                             │
   │  • Output: "Merged! Task complete."                        │
   │                                                              │
   │  ┌──────────────────┐                                       │
   │  │ Changes requested│                                       │
   │  └────────┬─────────┘                                       │
   │           │                                                  │
   │           ▼                                                  │
   │  • Prompt user:                                             │
   │    ┌─────────────────────────────────────┐                 │
   │    │ PR #456 has requested changes.      │                 │
   │    │                                     │                 │
   │    │ [1] View comments                   │                 │
   │    │ [2] Run /festina-rework 001         │                 │
   │    └─────────────────────────────────────┘                 │
   │                                                              │
   │  ┌──────────────────┐                                       │
   │  │ PR already merged│                                       │
   │  └────────┬─────────┘                                       │
   │           │                                                  │
   │           ▼                                                  │
   │  • Update task status → "done"                             │
   │  • Output: "Already merged! Task complete."                │
   │                                                              │
   └─────────────────────────────────────────────────────────────┘
```

**Key insight:** User can close terminal at any prompt. Next run reads GitHub state and resumes from correct position.

---

## Task XML Attributes

```xml
<task id="001"
      status="pr"
      github-issue="#123"
      github-pr="#456"
      github-url="https://github.com/owner/repo/issues/123">
  ...
</task>
```

| Attribute | Set by | Purpose |
|-----------|--------|---------|
| `github-issue` | festina-create | Links to GitHub Issue |
| `github-pr` | festina-merge | Links to Pull Request |
| `github-url` | festina-create | Quick reference URL |

---

## The Directive

`.festinalente/directives/github.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<directive name="github" version="1"
           created="2026-02-27" updated="2026-02-27">

  <description>
    Integrate with GitHub Issues and PRs via MCP.
    Issues provide human visibility. PRs enable team review workflow.
    State lives in GitHub - commands are stateless and resumable.
  </description>

  <context>
    <principle id="G1" keywords="issue,create,sync">
      Every task syncs to a GitHub Issue. Title from task/title, body is raw XML.
    </principle>
    <principle id="G2" keywords="pr,merge,review">
      PRs are created at merge time. Merging requires checking PR approval state.
    </principle>
    <principle id="G3" keywords="stateless,resumable">
      Commands read GitHub state each run. User can close terminal and resume anytime.
    </principle>
    <principle id="G4" keywords="closes,autolink">
      PR body includes "Closes #N" to auto-close issue when PR merges.
    </principle>
    <principle id="G5" keywords="mcp,github,tools">
      Use GitHub MCP tools for all GitHub operations: mcp__GitHub__create_issue,
      mcp__GitHub__issue_read, mcp__GitHub__create_pull_request,
      mcp__GitHub__pull_request_read, mcp__GitHub__merge_pull_request.
    </principle>
  </context>

  <process>
    <!-- festina-create: ADDITIVE rules (run after normal create flow) -->
    <rule id="C-G1" phase="create">
      AFTER creating task.xml, check if $ARGUMENTS was a GitHub issue number (#N):
      If yes:
        1. Fetch issue #N from GitHub via mcp__GitHub__issue_read
        2. Parse the issue body (which contains task XML from a previous sync)
        3. Store github-issue="#N" and github-url on task element
      If no (normal title):
        1. Create GitHub Issue via mcp__GitHub__issue_write with:
           - title: task title
           - body: raw XML content of task.xml
        2. Store github-issue="#N" and github-url on task element
    </rule>

    <!-- festina-merge: OVERRIDE rules (replace normal merge behavior) -->
    <rule id="M-G0" phase="merge">
      CRITICAL OVERRIDE: When this directive is active, DO NOT perform the normal
      local git merge workflow. Specifically, SKIP these steps from festina-merge:
        - git checkout main
        - git merge task/{taskId} --no-ff
        - git branch -d task/{taskId}

      INSTEAD, follow the GitHub PR workflow defined in rules M-G1 through M-G5.
      The merge will happen via GitHub, not locally.
    </rule>

    <rule id="M-G1" phase="merge">
      STATE CHECK: Read task.xml and check for github-pr attribute.

      If task has NO github-pr attribute → Go to rule M-G2 (create PR)
      If task HAS github-pr attribute → Go to rule M-G3 (check PR status)
    </rule>

    <rule id="M-G2" phase="merge">
      CREATE PR (when no github-pr exists):
      1. Ensure branch is pushed to origin: git push -u origin task/{taskId}
      2. Create PR via mcp__GitHub__create_pull_request:
         - title: task title
         - body: "Closes #{github-issue}\n\n{task XML content}"
         - head: task/{taskId}
         - base: main
      3. Store github-pr="#{pr-number}" on task element
      4. Commit the task.xml update
      5. Prompt user with AskUserQuestion:
         - header: "PR Created"
         - question: "PR #{pr-number} created. What would you like to do?"
         - options:
           - "Open in browser" → Output PR URL, exit
           - "Done for now" → Exit
      6. EXIT skill (do not continue)
    </rule>

    <rule id="M-G3" phase="merge">
      CHECK PR STATUS (when github-pr exists):
      1. Fetch PR status via mcp__GitHub__pull_request_read (method: "get")
      2. Route based on PR state:
         - state="merged" → Go to rule M-G4
         - state="closed" → Prompt: "PR was closed. Create new PR?"
         - reviewDecision="CHANGES_REQUESTED" → Prompt: "Changes requested. [View comments] [Run /festina-rework]", exit
         - reviewDecision="APPROVED" → Go to rule M-G5
         - reviewDecision=null/PENDING → Prompt: "Awaiting review. [Open in browser] [Done]", exit
    </rule>

    <rule id="M-G4" phase="merge">
      PR ALREADY MERGED:
      1. Update task.xml: status="done", add completed="{date}"
      2. Commit: git add task.xml && git commit -m "docs({taskId}): done - {title}"
      3. Pull latest main: git checkout main && git pull
      4. Delete local branch: git branch -d task/{taskId}
      5. Output: "PR was already merged! Task complete."
      6. EXIT skill
    </rule>

    <rule id="M-G5" phase="merge">
      MERGE APPROVED PR:
      1. Prompt user with AskUserQuestion:
         - header: "Ready to Merge"
         - question: "PR #{pr-number} is approved. Ready to merge?"
         - options:
           - "Merge now (recommended)" → Continue to step 2
           - "Wait" → Exit skill
      2. Merge via mcp__GitHub__merge_pull_request (merge_method: "squash")
      3. Update task.xml: status="done", add completed="{date}"
      4. Commit: git add task.xml && git commit -m "docs({taskId}): done - {title}"
      5. Pull latest main: git checkout main && git pull
      6. Output: "Merged! Task complete."
      7. EXIT skill
    </rule>
  </process>

  <validation>
    <check id="V-G1" type="checklist" severity="error">
      <item>GitHub MCP server is connected (test with any mcp__GitHub__ tool)</item>
      <item>Repository has remote origin configured (git remote -v shows origin)</item>
      <item>Current branch is task/{taskId} when running merge</item>
    </check>
  </validation>

</directive>
```

---

## What This Replaces

When the GitHub directive is active on festina-merge:

| Without Directive | With Directive |
|-------------------|----------------|
| Local merge to main | PR-based merge via GitHub |
| `git merge --no-ff` | `merge_pull_request` MCP call |
| Branch deleted locally | Branch deleted by GitHub on merge |
| No review process | Full PR review workflow |

The directive **overrides** the normal local merge behavior entirely.

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No internet | MCP calls fail, user sees error |
| PR closed without merge | Prompt shows "PR closed" state, suggest reopen or new PR |
| Branch conflicts | GitHub blocks merge, prompt shows "Has conflicts" |
| Required checks failing | Prompt shows "Checks failing", link to PR |

---

## Solo Developer Mode

For solo devs who don't need approvals:

1. Create PR (required for visibility)
2. Immediately select "Merge now" (no waiting)

The workflow still uses PRs for history/visibility but doesn't block on approvals.

---

## Testing the Directive

### Test 1: festina-create with GitHub sync

```bash
# Add github directive to festina-create in config.yaml
/festina-create "Test GitHub integration"
```

**Expected:**
- Task created locally
- GitHub Issue created
- `github-issue` and `github-url` attributes added to task.xml

### Test 2: festina-merge creates PR

```bash
# Work through normal flow: scope, plan, implement, check, docs
# Then run merge
/festina-merge {taskId}
```

**Expected (first run):**
- Branch pushed to origin
- PR created on GitHub
- `github-pr` attribute added to task.xml
- User prompted with "PR created" options
- Skill exits (no local merge)

### Test 3: festina-merge checks PR status

```bash
# Run again after PR exists
/festina-merge {taskId}
```

**Expected:**
- PR status fetched from GitHub
- User prompted based on state (awaiting review / approved / changes requested)

### Test 4: festina-merge completes on approval

```bash
# After PR is approved on GitHub, run merge
/festina-merge {taskId}
```

**Expected:**
- User prompted "Ready to merge?"
- On "Merge now": PR merged via MCP, task marked done
- Local main branch updated

---

## Potential Issues

| Issue | Solution |
|-------|----------|
| LLM still tries local merge | Make M-G0 rule more explicit, list exact steps to skip |
| MCP tools not available | Validation check V-G1 catches this early |
| Branch not pushed | Rule M-G2 handles push before PR creation |
| PR conflicts | GitHub will reject merge, user sees error |
| Rate limiting | GitHub MCP should handle, user may need to wait |

---

---

## Part 2: Directive System Enhancement

Before creating the github directive, we need to enhance the directive system to formally support overrides.

### Why This Is Needed

Currently, directives ADD rules but have no formal way to OVERRIDE skill steps. Our github directive needs to REPLACE the local merge steps with PR workflow. Without structured overrides, we rely on the LLM interpreting natural language like "SKIP these steps" - which is unreliable.

### The Solution: Add `<override>` Section

Directives can declare which skill steps to skip and what replaces them:

```xml
<directive name="github">

  <!-- NEW: Formal override declaration -->
  <override phase="merge">
    <skip step="merge_branch"/>
    <skip step="cleanup_branch"/>
    <reason>GitHub PR workflow replaces local merge</reason>
    <instead rules="M-G1,M-G2,M-G3,M-G4,M-G5"/>
  </override>

  <context>...</context>
  <process>...</process>

</directive>
```

### Files to Modify

All source files are in `apps/festinalente/src/`:

| File | Change |
|------|--------|
| `content/partials/load-directives.md` | Parse `<override>` sections, output explicit skip instructions |
| `content/skills/festina-directive/SKILL.md` | Add Q&A flow for creating overrides |
| `scripts/validate-directive.ts` | Validate step names exist in target skill |

### Change 1: `load-directives.md`

**Location:** `apps/festinalente/src/content/partials/load-directives.md`

Add after existing directive loading logic:

```markdown
<branch condition="directive has <override> for phase={{skill}}">
  <output>
**DIRECTIVE OVERRIDE ACTIVE: {{directive.name}}**

When executing this skill, the following steps are REPLACED:

{{#each override.skip}}
SKIP: <step name="{{step}}"> — Do NOT execute this step.
{{/each}}

INSTEAD, execute these directive rules in order:
{{#each override.instead}}
- Rule {{rule}}: [description from directive]
{{/each}}

Reason: {{override.reason}}

IMPORTANT: When you encounter a skipped step in the skill's <process>,
do not execute it. Execute the replacement rules from the directive instead.
  </output>
</branch>
```

### Change 2: `festina-directive` Skill

**Location:** `apps/festinalente/src/content/skills/festina-directive/SKILL.md`

Add new step after `collect_process`:

```markdown
<step name="collect_overrides" when="user selected Process">
  <action>Use AskUserQuestion tool with:
    - header: "Override"
    - question: "Does this directive need to REPLACE any existing skill steps?"
    - options:
      - label: "No", description: "Just add new rules alongside existing behavior"
      - label: "Yes", description: "Replace specific steps with directive rules"
    - multiSelect: false
  </action>

  <branch condition="user selects Yes">
    <action>Use AskUserQuestion tool with:
      - header: "Skill"
      - question: "Which skill's steps are being replaced?"
      - options:
        - label: "festina-create", description: "Task creation"
        - label: "festina-merge", description: "Branch merging"
        - label: "festina-implement", description: "Code implementation"
        - label: "festina-check", description: "Code review"
      - multiSelect: false
    </action>

    <action>Read the selected skill file to get step names</action>
    <action>List available steps to user</action>

    <action>Use AskUserQuestion tool with:
      - header: "Steps"
      - question: "Which steps should be SKIPPED when this directive is active?"
      - options: [dynamically built from skill's step names]
      - multiSelect: true
    </action>

    <action>Use AskUserQuestion tool with:
      - header: "Replacement"
      - question: "Which directive rules replace the skipped steps?"
      - options:
        - label: "Skip", description: "I'll specify rule IDs manually"
      - multiSelect: false
    </action>
    <note>User provides rule IDs like "M-G1,M-G2,M-G3"</note>

    <action>Use AskUserQuestion tool with:
      - header: "Reason"
      - question: "Why are these steps being replaced?"
      - options:
        - label: "Skip", description: "Move to next section"
      - multiSelect: false
    </action>
  </branch>
</step>

<step name="generate_xml" outputs="directivePath">
  <!-- Add override section to generated XML if collected -->
  <branch condition="overrides were collected">
    <action>Add <override> section to directive XML:</action>
    <example_code lang="xml">
<override phase="{skill}">
  {{#each skipped_steps}}
  <skip step="{{this}}"/>
  {{/each}}
  <reason>{reason}</reason>
  <instead rules="{rule_ids}"/>
</override>
    </example_code>
  </branch>
</step>
```

### Change 3: `validate-directive.ts`

**Location:** `apps/festinalente/src/scripts/validate-directive.ts`

Add validation for override sections:

```javascript
// Validate <override> sections
const overrides = doc.querySelectorAll('override');
for (const override of overrides) {
  const phase = override.getAttribute('phase');
  if (!phase) {
    errors.push('<override> must have a phase attribute');
    continue;
  }

  // Check that referenced steps exist in target skill
  const skillPath = `content/skills/festina-${phase}/SKILL.md`;
  const skillContent = fs.readFileSync(skillPath, 'utf-8');

  const skips = override.querySelectorAll('skip');
  for (const skip of skips) {
    const stepName = skip.getAttribute('step');
    if (!skillContent.includes(`name="${stepName}"`)) {
      errors.push(`Override references unknown step "${stepName}" in festina-${phase}`);
    }
  }

  // Check that replacement rules exist in this directive
  const instead = override.querySelector('instead');
  if (instead) {
    const ruleIds = instead.getAttribute('rules').split(',');
    for (const ruleId of ruleIds) {
      if (!doc.querySelector(`rule[id="${ruleId.trim()}"]`)) {
        errors.push(`Override references unknown rule "${ruleId}" in this directive`);
      }
    }
  }
}
```

---

## Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | Update load-directives.md with override handling | `apps/festinalente/src/content/partials/load-directives.md` |
| 2 | Update festina-directive skill with override Q&A | `apps/festinalente/src/content/skills/festina-directive/SKILL.md` |
| 3 | Update validate-directive.ts with override validation | `apps/festinalente/src/scripts/validate-directive.ts` |
| 4 | Rebuild festinalente (`pnpm build`) | - |
| 5 | Create github.xml directive with override section | `.festinalente/directives/github.xml` |
| 6 | Update config.yaml to assign directive | `.festinalente/config.yaml` |
| 7 | Test the full workflow | - |

---

## Summary

| Component | Purpose |
|-----------|---------|
| **GitHub Issue** | Human-readable task view |
| **GitHub PR** | Code review and approval |
| **github.xml directive** | Adds GitHub behavior to create/merge |
| **MCP Server** | API access to GitHub |
| **Stateless design** | No sync problems, resumable anytime |
| **`<override>` system** | Formal way for directives to replace skill steps |
| **load-directives.md** | Outputs explicit skip instructions to LLM |
| **festina-directive skill** | Helps users create directives with overrides |
