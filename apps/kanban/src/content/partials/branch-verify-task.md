<command>git branch --show-current</command>
<validate>Must be on branch `task/{id}` where {id} is the task ID</validate>
<branch condition="not on expected branch">
  <output>Error: This command must be run on branch task/{id}. Current branch: {branch}</output>
  <output>Suggest: Switch to task branch with `git checkout task/{id}`</output>
  <action>Exit</action>
</branch>
