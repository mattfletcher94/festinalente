{{#if step_number}}{{step_number}}. {{/if}}**Verify on main branch**:
   - Run `git branch --show-current`
   - If not on `main` (or `master`):
     - Error: "This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: \{branch\}"
     - Suggest: "Switch to main with `git checkout main`"
     - Exit