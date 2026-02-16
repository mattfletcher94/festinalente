<note>Use these scripts to work with engineering documentation:</note>

{{#if show_list_engineering}}
<command description="List all engineering docs (returns JSON with count and docs array)">node .kanban/scripts/list-engineering.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-engineering.cjs --type=pattern</command>
<command description="Filter components by system">node .kanban/scripts/list-engineering.cjs --system=auth</command>
{{/if}}

{{#if show_search_engineering}}
<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-engineering.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-engineering.cjs middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>
{{/if}}

{{#if show_check_engineering}}
<command description="Check if engineering docs exist by ID">node .kanban/scripts/check-engineering.cjs systems/auth patterns/middleware</command>
{{/if}}

<note>Path rules:
- `overview` → `.kanban/engineering/overview.md`
- `systems/auth` → `.kanban/engineering/systems/auth/index.md`
- `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
</note>
