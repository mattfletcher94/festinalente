<note>Use these scripts to work with product documentation:</note>

{{#if show_list_product}}
<command description="List all product docs (returns JSON with count and docs array)">node .kanban/scripts/list-product.cjs</command>
<command description="Filter by type">node .kanban/scripts/list-product.cjs --type=feature</command>
<command description="Filter by domain">node .kanban/scripts/list-product.cjs --domain=auth</command>
{{/if}}

{{#if show_search_product}}
<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .kanban/scripts/search-product.cjs keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .kanban/scripts/search-product.cjs password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>
{{/if}}

{{#if show_check_product}}
<command description="Check if product docs exist by ID">node .kanban/scripts/check-product.cjs auth/login auth/mfa billing/invoices</command>
{{/if}}

<note>Path rule: ID `auth/login` → Path `.kanban/product/auth/login.md`</note>
