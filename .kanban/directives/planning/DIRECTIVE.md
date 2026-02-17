---
name: "Planning"
description: "Create implementation plans that build in compliance from the start"
---

# Planning

Create implementation plans that build in compliance from the start, not as an afterthought.

**Goal**: Plans should be designed so that code review passes on first attempt. The other directives are design constraints, not just validators.

---

## Planning Philosophy - HARD Rules

**Plans must incorporate these constraints during design, not add them during review:**

1. **Zero Backwards Compatibility** - Break things properly, update all callers
2. **Acyclic Architecture** - DAG only, proper categorization, explicit DI
3. **Vue Integration** - createContext pattern, thin components, orchestrators hold state
4. **Complete Documentation** - TSDoc on all public APIs with required tags
5. **Safe Tests** - AAA structure, no weakening, proper mocking by category
6. **Type Safety** - No `any`, explicit return types, domain types

---

## Planning Process

### Phase 1: Understand Requirements

Clarify what needs to be built, why, and success criteria.

### Phase 2: Apply Design Constraints

Before designing the solution, explicitly consider each constraint:

#### A. Architecture Constraints

**Module Categorization** - Every module must be:
- **Computer** (`.computer.ts`) - Pure computation, no side effects
- **Capability** (`.capability.ts`) - Manages single resource/effect
- **Orchestrator** (`.orchestrator.ts`) - Coordinates multiple dependencies

**Dependency Rules:**
- Computers can only import other computers
- Capabilities can import computers directly
- Capabilities CANNOT import other capabilities
- Orchestrators inject capabilities via explicit DI
- Zero circular dependencies

**Policy vs Mechanism:**
- NO `ensureXExists()`, `getOrCreateX()`, `maybeDoX()` in capabilities
- Cache/pool policy belongs in orchestrators
- Lazy initialization belongs in orchestrators
- Capabilities expose pure mechanism only

**Breaking Changes:**
- NO backwards compatibility shims
- NO deprecation notices
- NO legacy flags
- Delete old code, update all callers directly

#### B. Vue Integration Constraints

**createContext Pattern:**
- All shared state uses `createContext<T>(name)`
- Provider components call `provideX(createX())`
- Consumers call `injectX()`

**Layer Responsibilities:**
- Components are thin - just `injectX()` and template
- Orchestrators hold Vue state (refs, shallowRefs, computed)
- Capabilities are plain TypeScript - no Vue reactivity
- Computers are pure functions - no Vue, no side effects

**Composition Root:**
- App.vue creates all computers, capabilities, orchestrators
- App.vue wires dependencies
- App.vue calls `provideX()` for each orchestrator

#### C. Documentation Constraints

All public APIs require TSDoc with:
- Multi-line format
- `@param name - description` (hyphen required)
- `@returns` describing what's returned
- `@throws` for all error conditions
- `@typeParam` for generic type parameters

**Forbidden:**
- File headers or banners
- Single-line comments for public APIs
- Missing documentation on exports

#### D. Test Constraints

All new functionality requires tests with:
- **AAA structure** - Arrange, Act, Assert sections
- No skipped tests
- No weakened assertions
- Proper mocking by category

**Test by category:**
- Computers: Direct unit tests with plain data
- Capabilities: Mock external resources
- Orchestrators: Inject mock capabilities, verify coordination

#### E. Type Safety Constraints

**Required:**
- Explicit return types on all exported functions
- Domain types for IDs (`type TaskId = string & { __brand: 'TaskId' }`)
- Discriminated unions for states
- `readonly` on value objects
- `unknown` instead of `any`

**Forbidden:**
- `any` type
- `as any` assertions
- Boolean flags for mutually exclusive states
- Missing types on exports

---

### Phase 3: Design Solution

Create a design that naturally satisfies all constraints:

**1. Module Structure**
- List all modules with correct suffixes
- Show dependency graph (must be DAG)
- Identify composition root (App.vue)

**2. API Design**
- Function signatures with explicit types
- TSDoc for each public function
- Error conditions and return types

**3. Vue Integration**
- Which orchestrators are needed
- What state they hold (refs, computed)
- Provider setup in App.vue

**4. Test Strategy**
- What to test
- How to mock (if needed)
- Edge cases to cover

**5. Implementation Order**
- Computers first (pure computation, no dependencies)
- Capabilities second (can import computers)
- Orchestrators third (wire capabilities)
- Providers fourth (createContext wrappers)
- Components last (thin UI)

**6. Breaking Changes**
- What's being removed/changed
- All callers that need updating
- No compatibility layers

---

### Phase 4: Validate Plan Against Constraints

Before presenting the plan, verify:

- [ ] All modules have proper suffix (`.computer.ts`, `.capability.ts`, `.orchestrator.ts`)
- [ ] Dependency graph is acyclic
- [ ] No capability imports another capability
- [ ] No policy logic in capabilities
- [ ] Vue state only in orchestrators
- [ ] createContext pattern used for all providers
- [ ] All public APIs have TSDoc with required tags
- [ ] Tests planned for all new functionality
- [ ] No backwards compatibility shims
- [ ] Explicit types on all exports

---

### Phase 5: Present Plan

Structure the plan as:

```markdown
## Overview
[What we're building and why]

## Breaking Changes
[What's being removed/changed, no compatibility layers]

## Module Structure

### Computers
- `feature-x.computer.ts` - Pure computation for [...]
  - Dependencies: [other computers]

### Capabilities
- `feature-x.capability.ts` - Manages [resource]
  - Dependencies: [computers only]

### Orchestrators
- `feature-x.orchestrator.ts` - Coordinates [...]
  - Dependencies: [capabilities + computers via DI]
  - Vue State: [refs, computed values]

### Providers
- `FeatureXProvider.ts` - createContext wrapper
  - Exposes: [injectFeatureX, provideFeatureX]

## Dependency Graph
[Show graph, verify it's a DAG]

## API Design
[Function signatures with TSDoc]

## Vue Integration
- Composition root setup in App.vue
- Provider hierarchy
- Component consumption pattern

## Test Strategy
- Test X with mock Y
- Edge cases: [...]
- Error conditions: [...]

## Implementation Order
1. [Computers first]
2. [Capabilities second]
3. [Orchestrators third]
4. [Providers fourth]
5. [Components last]
6. [Tests for everything]

## Validation Checklist
- [ ] Acyclic dependencies
- [ ] Proper module categorization
- [ ] createContext pattern used
- [ ] TSDoc on all exports
- [ ] Tests for all new code
- [ ] No backwards compatibility
- [ ] Explicit types everywhere
```

---

## Common Planning Mistakes

**X Planning to "add backwards compatibility"**
-> Plan direct breaking change + caller updates

**X "We'll add tests later"**
-> Tests are part of the plan from the start

**X Designing capabilities that import other capabilities**
-> Factor out shared logic to computers, or inject via orchestrator

**X "We'll document it after implementation"**
-> API signatures with TSDoc are part of the design

**X Adding `maybeCreateX()` or `ensureXExists()` to capabilities**
-> Put decision logic in orchestrator, pure mechanism in capability

**X Planning features without considering module categorization**
-> Every new file has correct suffix from the start

**X Putting Vue reactivity in capabilities**
-> Only orchestrators use Vue refs/computed

**X Direct provide/inject in components**
-> Always use createContext pattern

---

## Success Criteria

A good plan:
- Can be implemented without violating any constraint
- Will pass code review on first try
- Requires no "we'll fix this in review" items
- Has clear breaking changes with no compatibility shims
- Shows complete dependency graph (verified acyclic)
- Uses createContext for all providers
- Includes TSDoc for all new exports
- Includes tests for all new functionality

---

**This directive is the single source of truth for implementation planning.**
