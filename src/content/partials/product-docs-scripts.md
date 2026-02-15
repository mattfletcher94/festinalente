## Product Documentation Scripts

Use these scripts to work with product documentation:

```bash
{{#if show_list_product}}
# List all product docs (returns JSON with count and docs array)
node .claude/scripts/list-product.cjs

# Filter by type (feature, concept, overview)
node .claude/scripts/list-product.cjs --type=feature

# Filter by domain
node .claude/scripts/list-product.cjs --domain=auth

{{/if}}
{{#if show_search_product}}
# Search product docs by keywords (returns JSON sorted by relevance)
node .claude/scripts/search-product.cjs keyword1 keyword2 ...

# With minimum score threshold
node .claude/scripts/search-product.cjs password reset --min-score=0.3

# Score interpretation:
# - Score ≥ 0.5: Strong match, likely relevant
# - Score 0.3-0.5: Possible match, worth reading
# - Score < 0.3: Weak match, probably not relevant
# - No results: Likely a new feature (no existing docs)

{{/if}}
{{#if show_check_product}}
# Check if product docs exist by ID (returns JSON with exists status)
node .claude/scripts/check-product.cjs auth/login auth/mfa billing/invoices

{{/if}}
```

**Path rule:** ID `auth/login` → Path `.kanban/product/auth/login.md`
