# Check: TypeScript

Run `pnpm typecheck` (or `npm run typecheck` / `npx tsc --noEmit`)

### Pass criteria

Exit code 0, no errors in output.

### Common failures

- "Cannot find module X" — missing dependency, run `pnpm install`
- "Type X is not assignable to Y" — type mismatch, fix the code
- "Property X does not exist on type Y" — accessing undefined property
- "Argument of type X is not assignable to parameter of type Y" — function call with wrong argument types
