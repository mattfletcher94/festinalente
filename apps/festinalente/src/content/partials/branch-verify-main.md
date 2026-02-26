<command>git branch --show-current</command>
<validate>Must be on `main` or `master` branch</validate>
<branch condition="not on main/master">
  <output>Error: This command must be run on the main branch{{#if reason}} {{reason}}{{/if}}. Current branch: {branch}</output>
  <output>Suggest: Switch to main with `git checkout main`</output>
  <action>Exit</action>
</branch>
