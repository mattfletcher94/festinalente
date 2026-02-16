#!/usr/bin/env node

// Find plan file by task ID
// Usage: node find-plan.cjs <id>
// Returns JSON with path and metadata

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const TASKS_DIR = '.kanban/tasks';

function findPlanFile(id: string): string | null {
  const planPath = path.join(TASKS_DIR, id, 'plan.md');
  if (fs.existsSync(planPath)) {
    return planPath.replace(/\\/g, '/');
  }
  return null;
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(JSON.stringify({ error: true, message: 'Usage: find-plan.cjs <id>' }));
    process.exit(1);
  }

  const id = args[0];

  if (!fs.existsSync(TASKS_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${TASKS_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  // Find plan file in task folder
  const planPath = findPlanFile(id);

  if (!planPath) {
    console.log(JSON.stringify({
      error: true,
      message: `Plan for task ${id} not found in ${TASKS_DIR}/${id}/`
    }));
    process.exit(1);
  }

  const content = fs.readFileSync(planPath, 'utf8');
  const { data: frontmatter } = matter(content);

  const result = {
    id: id,
    filename: 'plan.md',
    path: planPath,
    task: (frontmatter.task as string) || id,
    spec: (frontmatter.spec as string) || '',
    status: (frontmatter.status as string) || '',
    iteration: parseInt((frontmatter.iteration as string) || '1', 10) || 1
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
