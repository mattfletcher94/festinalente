#!/usr/bin/env node

/**
 * Find quick task file by ID.
 *
 * Usage: node find-quick.cjs <id>
 *
 * @returns JSON with path and metadata.
 */

import fs from 'fs';
import path from 'path';
import { parseQuickXml } from './lib/xml-parser';

const QUICK_DIR = '.kanban/quick';

/**
 * Find a quick task file by ID.
 *
 * @param id - The quick task ID to find.
 * @returns The path to the quick.xml file, or null if not found.
 */
function findQuickFile(id: string): string | null {
  const quickPath = path.join(QUICK_DIR, id, 'quick.xml');
  if (fs.existsSync(quickPath)) {
    return quickPath.replace(/\\/g, '/');
  }
  return null;
}

/**
 * Main entry point.
 */
function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-quick.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(QUICK_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${QUICK_DIR}/ directory not found. No quick tasks exist yet.`
    }));
    process.exit(1);
  }

  // Find quick file in folder
  const quickPath = findQuickFile(id);

  if (!quickPath) {
    console.log(JSON.stringify({
      error: true,
      message: `Quick task ${id} not found in ${QUICK_DIR}/${id}/`
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(quickPath, 'utf8');
  const parsed = parseQuickXml(content);

  const result = {
    id: id,
    filename: 'quick.xml',
    path: quickPath,
    title: parsed.title,
    created: parsed.created,
    updated: parsed.updated
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
