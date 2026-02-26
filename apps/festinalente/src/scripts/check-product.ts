#!/usr/bin/env node

// Check if specific product docs exist by ID
// Usage: node check-product.cjs auth/login auth/mfa billing/invoices
// Returns JSON with existence status for each ID

import fs from 'fs';
import path from 'path';

const PRODUCT_DIR = '.festinalente/product';

interface CheckResult {
  id: string;
  exists: boolean;
  path: string;
}

interface Summary {
  existing: string[];
  missing: string[];
}

function main(): void {
  const ids = process.argv.slice(2);

  if (ids.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: check-product.cjs id1 id2 ... (e.g., auth/login auth/mfa)'
    }));
    process.exit(1);
  }

  const results: CheckResult[] = [];
  const existing: string[] = [];
  const missing: string[] = [];

  for (const id of ids) {
    // Construct path: .festinalente/product/{id}.md
    const docPath = path.join(PRODUCT_DIR, `${id}.md`).replace(/\\/g, '/');
    const exists = fs.existsSync(docPath);

    results.push({
      id: id,
      exists: exists,
      path: docPath
    });

    if (exists) {
      existing.push(id);
    } else {
      missing.push(id);
    }
  }

  const output = {
    results: results,
    summary: {
      existing: existing,
      missing: missing
    } as Summary
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
