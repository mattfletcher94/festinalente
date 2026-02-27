#!/usr/bin/env node

// Find spec file by task ID
// Usage: node find-spec.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import { parseSpecXml } from './lib/xml-parser';

const TASKS_DIR = '.festinalente/tasks';

function findSpecFile(id: string): string | null {
  const specPath = path.join(TASKS_DIR, id, 'spec.xml');
  if (fs.existsSync(specPath)) {
    return specPath.replace(/\\/g, '/');
  }
  return null;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-spec.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run npx festinalente first.`
    }));
    process.exit(1);
  }

  // Find spec file in task folder
  const specPath = findSpecFile(id);

  if (!specPath) {
    console.log(JSON.stringify({
      error: true,
      message: `Spec for task ${id} not found in ${TASKS_DIR}/${id}/`
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(specPath, 'utf8');
  const parsed = parseSpecXml(content);

  const result = {
    id: id,
    filename: 'spec.xml',
    path: specPath,
    task: parsed.task || id,
    created: parsed.created,
    updated: parsed.updated
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
