---
name: "Code Review"
description: "Perform strict architectural code review for this codebase"
---

# Code Review

Perform **strict architectural code review** for this codebase.

This review is adversarial by design. You are not here to approve changes. You are here to find problems, enforce standards, and reject violations.

---

## Core Philosophy

This codebase follows three non-negotiable principles:

1. **No Backwards Compatibility** - We do not maintain legacy behavior. We do not add compatibility shims. We do not preserve old APIs.
2. **No Deprecation Notices** - We do not mark things as deprecated. We delete them or we keep them. There is no middle ground.
3. **No Legacy Flags** - We do not add feature flags to preserve old behavior. If behavior changes, it changes everywhere.

**We move forward and break things, then fix them properly.**

If code introduces backwards compatibility layers, deprecation notices, legacy flags, or compatibility shims, it must be **rejected immediately**.

---

## Review Process

Execute these phases **in order**. Do not skip phases.

### Phase 0: Automated Checks

Before any manual review, run:

```bash
pnpm test
pnpm lint
pnpm typecheck
```

**If any command fails, stop the review immediately.**

### Phase 0.5: Forbidden Pattern Scan

Scan for instant-rejection patterns:

**Forbidden Patterns (BLOCKING):**

| Pattern | Example | Why Forbidden |
|---------|---------|---------------|
| Divider comments | `// --------` | Not documentation, just noise |
| File-level comments | TSDoc at line 1 | Document exports, not files |
| Shouty headers | `// SECTION NAME` | Use code structure, not comments |
| Future extensibility | `// for future use` | YAGNI |
| Empty options interfaces | `interface FooOptions {}` | Unused abstraction |
| Unused underscore params | `_options?: Options` | Never used |

### Phase 1: Immediate Rejections

**Automatic Rejection Triggers:**

- `@deprecated` tag without removal
- Backwards compatibility shims or wrappers
- Feature flags for old vs new behavior
- `// TODO: remove in v2` or similar deferred cleanup
- Re-exports of renamed symbols for compatibility
- Any comment containing "backwards compatible", "legacy", "deprecated"

### Phase 2: Architectural Classification

For every new or modified module, verify:

**Module Categories:**

| Category | File Suffix | Factory Pattern | Allowed Dependencies |
|----------|-------------|-----------------|---------------------|
| Computer | `.computer.ts` | `create{Name}Computer` | Only other computers |
| Capability | `.capability.ts` | `create{Name}Capability` | Only computers (direct) |
| Orchestrator | `.orchestrator.ts` | `create{Name}Orchestrator` | Computers + Capabilities (via DI) |

**Architectural Violations to Flag:**

- File not using correct suffix
- Factory not following `create{Name}{Category}` pattern
- Capability importing another capability
- Capability importing an orchestrator
- Computer importing a capability or orchestrator
- Policy logic inside a capability

**Forbidden Naming:**

- `*Manager`, `*Service`, `*Helper`, `*Utils`, `*Engine`, `*Singleton`

### Phase 3: Policy vs Mechanism

Capabilities must perform effects but **never encode policy**.

**Policy Violations in Capabilities (REJECT):**

- `ensureXExists()` - Policy: "create only if missing"
- `getOrCreateX()` - Policy: "reuse or create?"
- `maybeDoX()` - Policy: "should we do X?"
- Lazy initialization inside capabilities
- Cache/pool policy inside capabilities

### Phase 4: Vue Integration

**Check For:**

- Direct `provide`/`inject` without `createContext`
- Logic in Vue components (should be in orchestrators)
- Composables with side effects (should be capabilities)
- Vue reactivity outside orchestrators

### Phase 5: TSDoc Compliance

**Forbidden (Check First):**

- Banner/divider comments
- File-level TSDoc at line 1
- Single-line TSDoc on exports
- `@param` without hyphen

**Required:**

- All exported symbols have TSDoc
- Multi-line format
- `@param name - description` format
- `@returns`, `@throws` where applicable

### Phase 6: TypeScript Quality

**Automatic Rejection Triggers:**

- Using `any` in new code
- Using `as any` assertions
- Using `// @ts-ignore` without linked issue
- Missing return types on exports
- Raw primitives where domain types should exist

**Required:**

- Explicit return types on exports
- Domain types for IDs
- Discriminated unions for states
- `readonly` on value objects

### Phase 7: Test Safety

**Test Safety Violations (REJECT):**

- Deleting tests to make them pass
- Weakening assertions
- Adding `.skip` without linked issue
- Commenting out failing tests

**Required:**

- AAA structure
- One behavior per test
- Proper mocking by category

### Phase 8: Over-Engineering Detection

**Reject:**

- Abstractions for single use cases
- Interfaces with only one implementation
- Configuration for hypothetical scenarios
- Empty options interfaces
- Unused underscore parameters

**Prefer:**

- Three similar lines over a premature abstraction
- Direct code over indirection
- Adding parameters when needed, not "in case"

---

## Review Output Format

```md
## Code Review

### Verdict: APPROVED | APPROVED WITH CHANGES | REJECTED

### Automated Checks
- [ ] Tests pass
- [ ] Lint passes
- [ ] Types pass

### Immediate Rejections
[List any automatic rejection triggers, or "None"]

### Architectural Issues
[List violations by category]

### Vue Integration Issues
[List Vue pattern violations]

### TSDoc Issues
[List documentation violations]

### TypeScript Issues
[List type safety violations]

### Test Issues
[List test safety violations]

### Over-Engineering Concerns
[List unnecessary complexity]

### Required Changes
[Numbered list of changes that MUST be made]

### Suggested Improvements
[Optional improvements]
```

---

## Severity Levels

- **BLOCKING**: Must be fixed before merge. Includes architectural violations, backwards compatibility, test safety, type safety.
- **REQUIRED**: Must be addressed. Includes TSDoc, naming conventions, domain modeling.
- **SUGGESTED**: Should be considered. Includes style improvements.

---

## Final Instruction

Be thorough. Be strict. Be specific.

Every issue must include:
- Exact file path and line number
- What is wrong
- What the correct approach is

Do not approve code that violates core principles.
Do not soften feedback for politeness.
Do not accept "we'll fix it later" as justification.

**If the code makes the codebase harder to understand or maintain, reject it.**

---

**This directive is the single source of truth for code review standards.**
