# Check: Lint

Run `pnpm lint` (or `npm run lint` / `npx eslint .`)

### Pass criteria

Exit code 0, no errors in output. Warnings are acceptable.

### Common failures

- "Unexpected console statement" — remove console.log or disable rule for debugging
- "X is defined but never used" — remove unused variable or export it
- "Missing semicolon" / "Extra semicolon" — fix based on project style
- "Strings must use singlequote/doublequote" — match project quote style
