<note>Use these scripts to work with engineering documentation:</note>

{{#if show_list_engineering}}
<command description="List all engineering docs (returns JSON with count and docs array)">node .festinalente/scripts/festinalente.cjs list-engineering</command>
<command description="Filter by type">node .festinalente/scripts/festinalente.cjs list-engineering --type=pattern</command>
<command description="Filter components by system">node .festinalente/scripts/festinalente.cjs list-engineering --system=auth</command>
{{/if}}

{{#if show_search_engineering}}
<command description="Search engineering docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-engineering keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-engineering middleware pattern --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new pattern/system</note>
{{/if}}

{{#if show_check_engineering}}
<command description="Check if engineering docs exist by ID">node .festinalente/scripts/festinalente.cjs check-engineering systems/auth patterns/middleware</command>
{{/if}}

<note>Path rules:
- `overview` → `.festinalente/engineering/overview.md`
- `systems/auth` → `.festinalente/engineering/systems/auth/_index.md`
- `systems/auth/validator` → `.festinalente/engineering/systems/auth/validator.md`
- `patterns/acyclic-arch` → `.festinalente/engineering/patterns/acyclic-arch.md`
- `conventions/file-naming` → `.festinalente/engineering/conventions/file-naming.md`
</note>
