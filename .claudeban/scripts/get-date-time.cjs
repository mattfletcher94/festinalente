#!/usr/bin/env node

// Get formatted date-time strings
// Usage: node get-date-time.cjs
// Returns JSON with iso and date formats

function main() {
  const now = new Date();

  const result = {
    iso: now.toISOString(),
    date: now.toISOString().split('T')[0]
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
