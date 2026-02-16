#!/usr/bin/env node

// Search engineering docs by keywords, ranked by relevance using fuzzy matching
// Usage: node search-engineering.cjs keyword1 keyword2 ... [--min-score=0.3]
// Returns JSON with ranked results

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';

const ENGINEERING_DIR = '.kanban/engineering';

interface ParsedArgs {
  _: string[];
  'min-score'?: string;
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
  body: string;
  filePath: string;
}

interface SearchResult {
  id: string;
  title: string;
  score: number;
  summary: string;
  path: string;
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

  // systems/auth/index.md → id: "systems/auth", system: null
  // systems/auth/validator.md → id: "systems/auth/validator", system: "auth"
  if (parts[0] === 'systems') {
    if (parts.length === 3 && parts[2] === 'index') {
      // systems/auth/index → systems/auth
      return { id: `${parts[0]}/${parts[1]}`, system: null };
    } else if (parts.length === 3) {
      // systems/auth/validator → systems/auth/validator, system: auth
      return { id: withoutExt, system: parts[1] };
    } else if (parts.length === 2) {
      // This case shouldn't happen with proper structure, but handle it
      return { id: withoutExt, system: null };
    }
  }

  // patterns/acyclic-arch.md → id: "patterns/acyclic-arch", system: null
  // conventions/file-naming.md → id: "conventions/file-naming", system: null
  return { id: withoutExt, system: null };
}

function loadDocs(): EngineeringDoc[] {
  const files = scanRecursive(ENGINEERING_DIR);
  const docs: EngineeringDoc[] = [];

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Use gray-matter to parse frontmatter and content
    const { data: frontmatter, content: body } = matter(content);
    const { id, system } = deriveIdAndSystem(filePath, ENGINEERING_DIR);

    docs.push({
      id: (frontmatter.id as string) || id,
      title: (frontmatter.title as string) || '',
      type: (frontmatter.type as string) || 'pattern',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      system: system,
      paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
      body: body.slice(0, 1000), // First 1000 chars of body for searching
      filePath: normalizedPath
    });
  }

  return docs;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const searchTerms = args._;
  const minScore = args['min-score'] ? parseFloat(args['min-score']) : 0.3;

  if (searchTerms.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: search-engineering.cjs keyword1 keyword2 ... [--min-score=0.3]'
    }));
    process.exit(1);
  }

  if (!fs.existsSync(ENGINEERING_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${ENGINEERING_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  const docs = loadDocs();

  if (docs.length === 0) {
    console.log(JSON.stringify({
      query: searchTerms,
      count: 0,
      docs: []
    }));
    return;
  }

  // Configure Fuse.js with weighted fields
  const fuse = new Fuse(docs, {
    keys: [
      { name: 'keywords', weight: 0.4 },   // Explicit keywords are highest priority
      { name: 'title', weight: 0.3 },      // Title matches are important
      { name: 'id', weight: 0.25 },        // ID includes type prefix (e.g., systems/auth)
      { name: 'summary', weight: 0.2 },    // Summary is good context
      { name: 'system', weight: 0.15 },    // System grouping for components
      { name: 'paths', weight: 0.15 },     // Code paths this doc covers
      { name: 'body', weight: 0.1 }        // Body content (lower weight)
    ],
    threshold: 0.4,           // 0 = exact match, 1 = match anything
    includeScore: true,
    ignoreLocation: true,     // Match anywhere in the field
    useExtendedSearch: true,  // Enable extended search syntax
    findAllMatches: true
  });

  // Join search terms for combined search
  const query = searchTerms.join(' ');
  const fuseResults = fuse.search(query);

  // Convert Fuse results to our format
  // Fuse score is 0 (perfect) to 1 (no match), we invert it
  const results: SearchResult[] = fuseResults
    .map(result => ({
      id: result.item.id,
      title: result.item.title,
      score: Math.round((1 - (result.score || 0)) * 100) / 100, // Invert and round
      summary: result.item.summary,
      path: result.item.filePath
    }))
    .filter(result => result.score >= minScore);

  const output = {
    query: searchTerms,
    count: results.length,
    docs: results
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
