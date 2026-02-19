---
id: "cli/discovery"
title: "Discovery Skills"
type: feature
tldr: "Skills for codebase exploration and architecture mapping"
summary: "Interactive skills for exploring codebases, researching approaches, and mapping product/engineering architecture through Socratic Q&A"
keywords: [discovery, explore, map, architecture, socratic, research]
aliases: [exploration, mapping, codebase-analysis]
boundary: "Does not modify code or create tasks - pure research and documentation"
related: [cli/lifecycle, cli/docs]
updated: 2026-02-19
---

# Discovery Skills

> **TL;DR:** Skills for codebase exploration and architecture mapping

## Overview

Discovery Skills allow users to explore and understand codebases before creating tasks. This is important because good task definition requires understanding the existing architecture, patterns, and constraints.

**Summary:** Research-first approach to understanding codebases and mapping architecture.

## How It Works

1. User invokes a discovery skill
2. Skill spawns parallel exploration agents
3. Skill runs Socratic Q&A to validate findings
4. Result: Documentation created or insights gathered

### Key Workflows

**Discovery Flow:**
- Explore codebase structure
- Identify patterns and relationships
- Ask clarifying questions
- Optionally create documentation or tasks

**Summary:** Explore, validate, document.

## Skills

### /kanban-discover

Socratic Q&A for codebase exploration without creating tasks.

- **Use case**: Research before task creation, auditing, understanding
- **Method**: Asks probing questions, presents findings, validates assumptions
- **Output**: Conversational insights (optionally chains to /kanban-create)

```
/kanban-discover "How does authentication work in this codebase?"
```

### /kanban-map-product

Maps product architecture through parallel exploration and Q&A.

- **Spawns**: 4 parallel agents (Feature Scanner, Domain Organizer, Dependency Mapper, Gap Detector)
- **Creates**: Product documentation in `.kanban/product/`
- **Creates**: Project glossary in `.kanban/glossary.yaml`

```
/kanban-map-product
```

### /kanban-map-engineering

Maps engineering systems, patterns, and conventions.

- **Spawns**: Parallel agents for systems, patterns, conventions
- **Creates**: Engineering documentation in `.kanban/engineering/`
- **Links**: Code references to documentation

```
/kanban-map-engineering
```

### /kanban-define-product

Initial product definition for new projects.

- **Use case**: First-time setup when no documentation exists
- **Creates**: Product overview and initial domain structure
- **Asks**: Product name, purpose, target users, key capabilities

```
/kanban-define-product
```

## Examples

### Typical Usage: Discover

```
User: /kanban-discover "What notification systems exist?"

Claude: I'll explore the codebase for notification-related code...

Found:
- Email notifications in src/notifications/email.ts
- Push notifications in src/notifications/push.ts
- Notification preferences in src/settings/preferences.ts

Let me ask some questions:
- Are email and push notifications used for the same events?
- Is there a preference hierarchy?

[Q&A continues...]
```

### Typical Usage: Map Product

```
User: /kanban-map-product

Claude: Launching 4 parallel agents...

[Feature Scanner] Found 12 features
[Domain Organizer] Suggests 4 domains
[Dependency Mapper] Found 8 relationships
[Gap Detector] Found 3 undocumented capabilities

I suggest organizing into: auth, tasks, notifications, admin

Does this make sense?
[Q&A continues...]

Created:
- 12 feature docs
- 4 domain indexes
- glossary.yaml with 25 terms
```

**Summary:** Discovery skills explore first, then ask questions, then document.

## Boundaries

What this feature does NOT do:

- **Does NOT:** Modify code (read-only exploration)
- **Does NOT:** Create tasks directly → See [Lifecycle Skills](./lifecycle.md)
- **Does NOT:** Run validations → See [Quality Skills](./quality.md)

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| None | Discovery skills are configuration-free | N/A |

## Interactions

- **Lifecycle Skills**: /kanban-discover can chain to /kanban-create
- **Documentation Skills**: Map skills create docs that /kanban-docs maintains

## Limitations

- Parallel agents require more API calls (higher token usage)
- Mapping requires user Q&A validation (not fully automated)
- Large codebases may require multiple mapping sessions
