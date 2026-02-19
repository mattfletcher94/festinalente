#!/usr/bin/env node

// List all engineering docs with optional filtering (recursive scan)
// Usage: node list-engineering.cjs [--type=X] [--system=X]
// Returns JSON with array of engineering docs

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const ENGINEERING_DIR = '.kanban/engineering';

interface ParsedArgs {
  _: string[];
  type?: string;
  system?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface EngineeringDoc {
  id: string;
  title: string;
  type: string;
  summary: string;
  keywords: string[];
  system: string | null;
  paths: string[];
  filePath: string;
}

function parseArgs(args: string[]): ParsedArgs {
  const result: ParsedArgs = { _: [] };

  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      result[key] = value || true;
    } else {
      result._.push(arg);
    }
  }

  return result;
}

function scanRecursive(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(scanRecursive(fullPath));
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

function deriveIdAndSystem(filePath: string, engineeringDir: string): { id: string; system: string | null } {
  const relativePath = path.relative(engineeringDir, filePath).replace(/\\/g, '/');
  const withoutExt = relativePath.replace(/\.md$/, '');
  const parts = withoutExt.split('/');

  // overview.md → id: "overview", system: null
  if (parts.length === 1) {
    return { id: parts[0], system: null };
  }

  // systems/auth/_index.md → id: "systems/auth", system: null
  // systems/auth/validator.md → id: "systems/auth/validator", system: "auth"
  if (parts[0] === 'systems') {
    if (parts.length === 3 && parts[2] === '_index') {
      // systems/auth/_index → systems/auth
      return { id: `${parts[0]}/${parts[1]}`, system: null };
    } else if (parts.length === 3) {
      // systems/auth/validator → systems/auth/validator, system: auth
      return { id: withoutExt, system: parts[1] };
    } else if (parts.length === 2) {
      return { id: withoutExt, system: null };
    }
  }

  // patterns/acyclic-arch.md → id: "patterns/acyclic-arch", system: null
  // conventions/file-naming.md → id: "conventions/file-naming", system: null
  return { id: withoutExt, system: null };
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(ENGINEERING_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${ENGINEERING_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  const files = scanRecursive(ENGINEERING_DIR).sort();
  const docs: EngineeringDoc[] = [];

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Use gray-matter to parse frontmatter
    const { data: frontmatter } = matter(content);
    const { id, system } = deriveIdAndSystem(filePath, ENGINEERING_DIR);

    const doc: EngineeringDoc = {
      id: (frontmatter.id as string) || id,
      title: (frontmatter.title as string) || '',
      type: (frontmatter.type as string) || 'pattern',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      system: system,
      paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
      filePath: normalizedPath
    };

    // Apply filters
    if (args.type && doc.type !== args.type) continue;
    if (args.system && doc.system !== args.system) continue;

    docs.push(doc);
  }

  const result = {
    count: docs.length,
    docs: docs
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
