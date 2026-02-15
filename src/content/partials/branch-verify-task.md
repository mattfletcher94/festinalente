{{#if step_number}}{{step_number}}. {{/if}}**Verify on task branch**:
   - Run `git branch --show-current`
   - Expected branch: `task/\{id\}` (where \{id\} is the task ID)
   - If not on expected branch:
     - Error: "This command must be run on branch task/\{id\}. Current branch: \{branch\}"
     - Suggest: "Switch to task branch with `git checkout task/\{id\}`"
     - Exit