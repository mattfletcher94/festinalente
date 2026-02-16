#!/usr/bin/env node

// Check if specific engineering docs exist by ID
// Usage: node check-engineering.cjs systems/auth patterns/middleware
// Returns JSON with existence status for each ID

import fs from 'fs';
import path from 'path';

const ENGINEERING_DIR = '.kanban/engineering';

interface CheckResult {
  id: string;
  exists: boolean;
  path: string;
}

interface Summary {
  existing: string[];
  missing: string[];
}

/**
 * Convert engineering doc ID to file path
 *
 * ID → Path mapping rules:
 * - `overview` → `.kanban/engineering/overview.md`
 * - `systems/auth` → `.kanban/engineering/systems/auth/index.md`
 * - `systems/auth/validator` → `.kanban/engineering/systems/auth/validator.md`
 * - `patterns/acyclic-arch` → `.kanban/engineering/patterns/acyclic-arch.md`
 * - `conventions/file-naming` → `.kanban/engineering/conventions/file-naming.md`
 */
function idToPath(id: string): string {
  // Special case: overview
  if (id === 'overview') {
    return path.join(ENGINEERING_DIR, 'overview.md');
  }

  const parts = id.split('/');

  // Systems have nested structure with index.md
  if (parts[0] === 'systems' && parts.length === 2) {
    // systems/auth → systems/auth/index.md
    return path.join(ENGINEERING_DIR, parts[0], parts[1], 'index.md');
  }

  // Everything else: direct mapping
  // systems/auth/validator → systems/auth/validator.md
  // patterns/acyclic-arch → patterns/acyclic-arch.md
  // conventions/file-naming → conventions/file-naming.md
  return path.join(ENGINEERING_DIR, `${id}.md`);
}

function main(): void {
  const ids = process.argv.slice(2);

  if (ids.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: check-engineering.cjs id1 id2 ... (e.g., systems/auth patterns/middleware)'
    }));
    process.exit(1);
  }

  const results: CheckResult[] = [];
  const existing: string[] = [];
  const missing: string[] = [];

  for (const id of ids) {
    // Construct path based on ID
    const docPath = idToPath(id).replace(/\\/g, '/');
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
