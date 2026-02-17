---
name: kanban-map-engineering
description: Analyze existing codebase and create engineering documentation through Socratic Q&A
allowed-tools: Read, Write, Glob, Grep, Bash(git add *, git commit *, git status), AskUserQuestion
disable-model-invocation: true
---

# Skill: Map Engineering

<purpose>
Analyze existing codebase and create engineering documentation through Socratic Q&A.
</purpose>

<context>
<note>Use these scripts to reliably find files:</note>






<command description="Get current date/time (returns JSON with iso and date formats)">node .kanban/scripts/get-date-time.cjs</command>


<note>Use these scripts to work with engineering documentation:</note>

<command description="List all engineering docs (returns JSON with count and docs array)">node .kanban/scripts/list-engineering.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-engineering.cjs --type=pattern</command>
<command description="Filter components by system">node .kanban/scripts/list-engineering.cjs --system=auth</command>



<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>

<note>**Column Transition:** N/A - This is a documentation command, not a task workflow command.</note>
</context>

<prohibited>
- Do not skip the codebase research phase
- Do not write docs without validating with user through Q&A
- Do not skip the commit step
</prohibited>

<process>
  <step name="load_workflow">
    <action>Read `.kanban/workflow.yaml` for column definitions, labels, priorities, and commit formats</action>
    <note>Use these values throughout this skill</note>
  </step>

  <step name="preflight_check">
    <action>Check if `.kanban/engineering/` has files OTHER than `overview.md`</action>
    <command>node .kanban/scripts/list-engineering.cjs</command>
    <branch condition="count > 1, OR if count == 1 and the doc is not `overview`">
      <prompt>I found existing engineering docs. How should I proceed?</prompt>
      <note>Options: Preserve and extend / Merge with findings / Start fresh</note>
    </branch>
    <branch condition="only `overview.md` exists (or no docs)">
      <action>Proceed without prompting (this is expected for new installs)</action>
    </branch>
  </step>

  <step name="deep_codebase_research">
    <note>Research the codebase thoroughly:</note>

    <note>**Tech Stack:**</note>
    <action>Read package.json, requirements.txt, Cargo.toml, go.mod, etc.</action>
    <action>Identify languages, frameworks, key dependencies</action>

    <note>**Directory Structure:**</note>
    <action>Use Glob to find source directories</action>
    <action>Map the high-level structure</action>

    <note>**Systems/Services:**</note>
    <action>Identify major subsystems (auth, api, database, etc.)</action>
    <action>Find entry points and boundaries</action>

    <note>**Patterns:**</note>
    <action>Look for architectural patterns (MVC, microservices, etc.)</action>
    <action>Identify naming conventions</action>
    <action>Find dependency injection patterns</action>
    <action>Note error handling approaches</action>

    <note>**Conventions:**</note>
    <action>File naming patterns</action>
    <action>Code organization within files</action>
    <action>Import/export patterns</action>
  </step>

  <step name="create_engineering_overview">
    <note>Based on codebase analysis, draft overview content:</note>
    <prompt>What is the main technology stack?</prompt>
    <prompt>What's the high-level architecture approach?</prompt>
    <warning>IMMEDIATELY create overview.md:</warning>
    <action>Create `.kanban/engineering/overview.md`</action>
    <action>Use template from `.kanban/templates/engineering-overview.md`</action>
    <action>Fill frontmatter: `id: overview`, `type: overview`, `title`, `summary`</action>
    <action>Fill body sections: Tech Stack, Architecture Summary, Directory Structure</action>
  </step>

  <step name="present_summary">
    <output>I analyzed the codebase and found the following:</output>
    <output>**Tech Stack:** {languages, frameworks}</output>
    <output>**Systems:** {major subsystems identified}</output>
    <output>**Patterns:** {architectural patterns observed}</output>
    <output>**Conventions:** {naming and organization patterns}</output>
    <output>Let me ask some questions to validate and expand on this understanding.</output>
  </step>

  <step name="socratic_qa_dialogue">
    <note>Use AskUserQuestion tool for **one question at a time**.</note>
    <warning>CRITICAL: Write docs incrementally to prevent context loss</warning>

    <note>**For each system (depth-first):**</note>
    <prompt>I found {system} that appears to handle {description}. Is this accurate?</prompt>
    <branch condition="user corrects">
      <action>Update understanding</action>
    </branch>
    <prompt>What are the key components within {system}?</prompt>
    <prompt>Are there any important patterns or constraints specific to this system?</prompt>

    <warning>IMMEDIATELY write the engineering doc:</warning>
    <action>Create folder if needed: `.kanban/engineering/systems/{system}/`</action>
    <command description="Get current date">node .kanban/scripts/get-date-time.cjs</command>
    <action>Create `.kanban/engineering/systems/{system}/index.md`</action>
    <action>Use template from `.kanban/templates/engineering-system.md`</action>

    <note>**For patterns discovered:**</note>
    <prompt>I noticed a {pattern} pattern. Can you tell me more about when/how to apply it?</prompt>
    <action>Create `.kanban/engineering/patterns/{pattern}.md`</action>
    <action>Use template from `.kanban/templates/engineering-pattern.md`</action>
    <action>Include examples from the codebase</action>

    <note>**For conventions discovered:**</note>
    <prompt>I see a convention for {thing}. Are there specific rules to follow?</prompt>
    <action>Create `.kanban/engineering/conventions/{convention}.md`</action>
    <action>Use template from `.kanban/templates/engineering-convention.md`</action>

    <note>**Exit:**</note>
    <prompt>Is there anything else about the engineering/architecture you'd like to document?</prompt>
    <branch condition="user says no/nothing/that's all">
      <action>Proceed to final review</action>
    </branch>
    <branch condition="user has more">
      <action>Continue Q&A</action>
    </branch>
  </step>

  <step name="final_review">
    <action>Read all generated engineering docs</action>
    <action>Update overview.md with links to created systems/patterns/conventions</action>
    <action>Verify all `related` fields are accurate across docs</action>
  </step>

  <step name="commit">
    <note>Format: `docs: map-engineering - {brief summary}`</note>
    <command>git add .kanban/engineering/</command>
    <command>git commit -m "docs: map-engineering - {systems, patterns listed}"</command>
    <note>Example: `docs: map-engineering - auth system, api system, middleware pattern`</note>
  </step>

  <step name="output_result">
    <output>Engineering documentation mapped!</output>
    <output>
**Next: Start creating tasks**
```
/clear
/kanban-create "Your task title"
```
    </output>
    <output>[KANBAN_COMPLETE]</output>
  </step>
</process>

<success_criteria>
- `.kanban/engineering/` directory exists
- At least `overview.md` was created
- Each doc has valid frontmatter (id, type, title, summary, keywords, paths, updated)
- Git log shows `docs: map-engineering -`
- Next steps shown to user
</success_criteria>

<next_steps>
```
/clear
/kanban-create "Your task title"
```
</next_steps>
