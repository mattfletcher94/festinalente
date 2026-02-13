# Check: Tests

Run `pnpm test` (or `npm test`)

### Pass criteria

Exit code 0, all tests pass.

### Common failures

- "Test suite failed to run" — syntax error or import issue in test file
- "Expected X but received Y" — assertion failure, check test logic or fix implementation
- "Cannot find module" — missing test dependency or incorrect import path
- "Timeout" — async operation taking too long, check for unresolved promises
