<note>Use these scripts to work with product documentation:</note>

{{#if show_list_product}}
<command description="List all product docs (returns JSON with count and docs array)">node .festinalente/scripts/festinalente.cjs list-product</command>
<command description="Filter by type">node .festinalente/scripts/festinalente.cjs list-product --type=feature</command>
<command description="Filter by domain">node .festinalente/scripts/festinalente.cjs list-product --domain=auth</command>
{{/if}}

{{#if show_search_product}}
<command description="Search product docs by keywords (returns JSON sorted by relevance)">node .festinalente/scripts/festinalente.cjs search-product keyword1 keyword2 ...</command>
<command description="With minimum score threshold">node .festinalente/scripts/festinalente.cjs search-product password reset --min-score=0.3</command>
<note>Score interpretation: ≥0.5 = strong match | 0.3-0.5 = possible match | &lt;0.3 = weak match | No results = likely new feature</note>
{{/if}}

{{#if show_check_product}}
<command description="Check if product docs exist by ID">node .festinalente/scripts/festinalente.cjs check-product auth/login auth/mfa billing/invoices</command>
{{/if}}

<note>Path rule: ID `auth/login` → Path `.festinalente/product/auth/login.md`</note>
