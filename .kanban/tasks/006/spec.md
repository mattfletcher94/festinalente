---
task: "006"
created: 2026-02-18
updated: 2026-02-18
---

# Functional Specification: Ask for task description first before other questions in kanban-create

## Context
When running `/kanban-create` without a title argument, the skill may ask configuration questions (like domain selection from product doc search) before the user has described their task. This creates a confusing UX where users must answer questions about priority, domain, or labels while still trying to remember what task they wanted to create.

The root cause is a step ordering issue: the `search_product_docs` and `search_engineering_docs` steps (which may prompt for domain) are positioned BEFORE the `get_task_details` step (which asks for the title). These search steps explicitly require "keywords from the task title" but execute before the title is known.

## Scope

### In Scope
- Reordering steps in the kanban-create skill so title is obtained first
- Splitting the `get_task_details` step into separate title and priority steps
- Ensuring the question order matches: title → doc search (with domain question if needed) → priority → label

### Out of Scope
- Changes to other kanban skills
- Changes to the doc search logic itself
- Changes to the priority or label question content
- Adding new questions or functionality

## Functional Requirements

- FR1: The system shall ask for the task title/description BEFORE any doc searches or configuration questions when running `/kanban-create` without a title argument
- FR2: The system shall accept the title silently (without re-prompting) when provided as an argument (e.g., `/kanban-create Fix login bug`)
- FR3: The system shall use keywords from the established title when searching product and engineering docs
- FR4: The system shall ask configuration questions in this order after title is established: doc search (with domain question if needed) → priority → label
- FR5: The `get_task_title` step shall only handle title collection, not priority
- FR6: A new `get_priority` step shall handle priority selection after doc searches complete

## Affected Files
- `apps/kanban/src/content/skills/kanban-create/SKILL.md` (modify) - Reorder steps and split get_task_details into get_task_title and get_priority

## Existing Patterns

- **Pattern:** Task-first then context search ordering
  - Reference: `apps/kanban/src/content/skills/kanban-refine/SKILL.md` - The refine skill reads the task file (which contains the title) in step `read_task_file`, then searches docs in step `analyze_initial_context`. This establishes the pattern: know the task first, then search for related context.

- **Pattern:** Step naming convention
  - Reference: `apps/kanban/src/content/skills/kanban-create/SKILL.md:57-131` - Steps are named with `get_X` prefix for input collection (e.g., `get_next_id`, `get_task_details`)

## Technical Constraints
- Must maintain the skill file's XML-like structure and formatting conventions
- Must preserve the `outputs` attribute on steps that export variables (e.g., `outputs="title, slug, priority, labels"`)
- The `get_task_title` step must set the `title` variable that subsequent steps depend on
- The `search_product_docs` step's keyword extraction must reference the title variable, not ask for it

## Dependencies

### External
- None

### Internal
- None

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM may still ask questions out of order despite step reordering | Medium | Clear step comments indicating dependencies; explicit "after title is established" language |
| Breaking existing `/kanban-create "title"` argument handling | Low | Test both argument and no-argument flows after change |

## Open Questions
- None - all questions resolved during scoping dialogue
