#!/usr/bin/env node

/**
 * Get the next available quick task ID.
 *
 * Usage: node next-quick-id.cjs
 *
 * @returns JSON with nextId, currentHighest, and padding.
 */

import fs from 'fs';

const QUICK_DIR = '.festinalente/quick';

/**
 * Get the next available quick task ID.
 */
function main(): void {
  const padding = 3;

  if (!fs.existsSync(QUICK_DIR)) {
    // No quick directory yet, start at 000
    const result = {
      nextId: '0'.padStart(padding, '0'),
      currentHighest: null,
      padding: padding
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Read folder names (each folder name IS the ID)
  const folders = fs.readdirSync(QUICK_DIR, { withFileTypes: true })
    .filter(f => f.isDirectory())
    .map(f => f.name);

  if (folders.length === 0) {
    const result = {
      nextId: '0'.padStart(padding, '0'),
      currentHighest: null,
      padding: padding
    };
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Find highest ID (folder names are "000", "001", etc.)
  let highest = -1;

  for (const folderName of folders) {
    const id = parseInt(folderName, 10);
    if (!isNaN(id) && id > highest) {
      highest = id;
    }
  }

  const nextId = (highest + 1).toString().padStart(padding, '0');
  const currentHighest = highest >= 0 ? highest.toString().padStart(padding, '0') : null;

  const result = {
    nextId: nextId,
    currentHighest: currentHighest,
    padding: padding
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
