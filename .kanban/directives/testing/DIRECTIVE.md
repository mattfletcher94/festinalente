---
name: "Testing Standards"
description: "Validate test quality, safety, and coverage against codebase standards"
---

# Testing Standards

Validate test quality, safety, and coverage against codebase standards.

**Primary goals:**
1. Do not break valid tests
2. If behavior changes intentionally, update tests accordingly
3. Keep tests high-quality, focused, and maintainable

---

## Quick Reference

### Test Safety Rules (BLOCKING)

| Violation | Why It's Forbidden |
|-----------|-------------------|
| Delete tests to make them pass | Hides regressions |
| Weaken assertions | Loses test value |
| Add `.skip`/`.todo` without issue | Deferred problems |
| Comment out failing tests | Hidden tech debt |
| Reduce coverage without explanation | Quality regression |

### Testing by Architecture

| Category | Mocking Strategy | What to Assert |
|----------|------------------|----------------|
| **Computer** | None - pure data in/out | Return values, computed results |
| **Capability** | Fake external resources | Resource interactions, lifecycle |
| **Orchestrator** | Fake capabilities via DI | Calls to capabilities, policy decisions |

### Required Structure

All tests must follow **AAA (Arrange / Act / Assert)**:

```ts
it('should sort tasks by status', () => {
  // Arrange
  const computer = createTaskComputer();
  const tasks = [
    { id: '1', status: 'done' },
    { id: '2', status: 'pending' },
  ];

  // Act
  const result = computer.sortByStatus(tasks);

  // Assert
  expect(result[0].status).toBe('pending');
  expect(result[1].status).toBe('done');
});
```

---

## Validation Checklist

1. **Run tests**: `pnpm test` (all must pass)

2. **Check test safety**:
   - No deleted tests without justification
   - No weakened assertions
   - No `.skip`, `.todo`, `xit` without linked issue
   - No commented-out tests

3. **Check structure**:
   - AAA pattern followed
   - One behavior per test
   - Clear, descriptive test names

4. **Check coverage**:
   - New code has tests
   - Edge cases covered
   - Error conditions tested

5. **Check mocking strategy**:
   - Computers: no mocks needed
   - Capabilities: fake external resources
   - Orchestrators: inject fake capabilities

---

## Common Violations

### Weakening Assertions (REJECT)

```ts
// WRONG: Weakened to make test pass
expect(result).toBeTruthy();  // Was: expect(result).toBe(5)

// CORRECT: Keep specific assertion, fix code if wrong
expect(result).toBe(5);
```

### Deleting Tests (REJECT)

```ts
// WRONG: Deleted test that was failing
// it('should validate input', () => { ... })  // Removed

// CORRECT: Fix the code or update test to match new behavior
it('should validate input', () => {
  // Updated to reflect intentional behavior change
});
```

### Skipping Without Issue (REJECT)

```ts
// WRONG: Skip without explanation
it.skip('should handle edge case', () => { ... });

// CORRECT: Link to issue
it.skip('should handle edge case', () => {
  // TODO: Fix in #123 - edge case broken after refactor
});
```

---

## Testing by Category

### Computer Tests (No Mocking)

Computers are pure functions - test with plain data:

```ts
describe('createTaskComputer', () => {
  it('should parse valid task ID', () => {
    // Arrange
    const computer = createTaskComputer();

    // Act
    const result = computer.parseId('TASK-001');

    // Assert
    expect(result).toBe('TASK-001');
  });

  it('should throw on invalid task ID', () => {
    // Arrange
    const computer = createTaskComputer();

    // Act & Assert
    expect(() => computer.parseId('')).toThrow('Invalid task ID');
  });
});
```

### Capability Tests (Fake External Resources)

```ts
describe('createElectronTasksCapability', () => {
  it('should call IPC to list tasks', async () => {
    // Arrange
    const mockIpc = {
      listTasks: vi.fn().mockResolvedValue([{ id: '1' }]),
    };
    const capability = createElectronTasksCapability({ ipc: mockIpc });

    // Act
    const result = await capability.listTasks('/path/to/project');

    // Assert
    expect(mockIpc.listTasks).toHaveBeenCalledWith('/path/to/project');
    expect(result).toEqual([{ id: '1' }]);
  });
});
```

### Orchestrator Tests (Fake Capabilities via DI)

```ts
describe('createAppOrchestrator', () => {
  it('should refresh tasks from capability', async () => {
    // Arrange
    const fakeTasksCapability = {
      listTasks: vi.fn().mockResolvedValue([
        { id: '1', status: 'pending' },
        { id: '2', status: 'done' },
      ]),
    };
    const taskComputer = createTaskComputer();
    const orchestrator = createAppOrchestrator({
      tasksCapability: fakeTasksCapability,
      taskComputer,
    });

    // Act
    await orchestrator.refreshTasks('/path');

    // Assert
    expect(fakeTasksCapability.listTasks).toHaveBeenCalledWith('/path');
    expect(orchestrator.tasks.value).toHaveLength(2);
  });

  it('should sort tasks after refresh', async () => {
    // Arrange
    const fakeTasksCapability = {
      listTasks: vi.fn().mockResolvedValue([
        { id: '1', status: 'done' },
        { id: '2', status: 'pending' },
      ]),
    };
    const taskComputer = createTaskComputer();
    const orchestrator = createAppOrchestrator({
      tasksCapability: fakeTasksCapability,
      taskComputer,
    });

    // Act
    await orchestrator.refreshTasks('/path');

    // Assert - pending tasks should come first (policy decision)
    expect(orchestrator.tasks.value[0].status).toBe('pending');
  });
});
```

---

## Test Naming Conventions

### Describe Blocks

Match the factory or function name:

```ts
describe('createTaskComputer', () => { ... });
describe('createElectronTasksCapability', () => { ... });
describe('createAppOrchestrator', () => { ... });
```

### Test Names

Describe condition and expected outcome:

```ts
// Good
it('should return empty array when input is empty', () => { });
it('throws when task ID is invalid', () => { });
it('should sort pending tasks before done tasks', () => { });

// Bad
it('works', () => { });
it('test 1', () => { });
it('handles edge case', () => { });
```

---

## Process When Changing Code

1. **Locate related tests**: Look for `{module}.test.ts` colocated with source

2. **Identify behaviors**: What inputs/outputs, side effects, error conditions?

3. **Align tests with intent**:
   - Behavior unchanged? Tests must pass without modification
   - Behavior changed intentionally? Update tests to match new behavior

4. **When tests fail**:
   - Assume test is right until proven otherwise
   - If change is intended: update test description and assertions
   - If change is unintended: fix the code, not the test

---

**This directive is the source of truth for testing practices.**
