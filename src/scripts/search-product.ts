#!/usr/bin/env node

// Search product docs by keywords, ranked by relevance using fuzzy matching
// Usage: node search-product.cjs keyword1 keyword2 ... [--min-score=0.3]
// Returns JSON with ranked results

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';

const PRODUCT_DIR = '.kanban/product';

interface ParsedArgs {
  _: string[];
  'min-score'?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface ProductDoc {
  id: string;
  title: string;
  type: string;
  summary: string;
  keywords: string[];
  domain: string | null;
  body: string;
  path: string;
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

function deriveIdAndDomain(filePath: string, productDir: string): { id: string; domain: string | null } {
  const relativePath = path.relative(productDir, filePath).replace(/\\/g, '/');
  const withoutExt = relativePath.replace(/\.md$/, '');
  const parts = withoutExt.split('/');

  if (parts.length === 1) {
    return { id: parts[0], domain: null };
  } else {
    return { id: withoutExt, domain: parts[0] };
  }
}

function loadDocs(): ProductDoc[] {
  const files = scanRecursive(PRODUCT_DIR);
  const docs: ProductDoc[] = [];

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Use gray-matter to parse frontmatter and content
    const { data: frontmatter, content: body } = matter(content);
    const { id, domain } = deriveIdAndDomain(filePath, PRODUCT_DIR);

    docs.push({
      id: (frontmatter.id as string) || id,
      title: (frontmatter.title as string) || '',
      type: (frontmatter.type as string) || 'feature',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      domain: domain,
      body: body.slice(0, 1000), // First 1000 chars of body for searching
      path: normalizedPath
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
      message: 'Usage: search-product.cjs keyword1 keyword2 ... [--min-score=0.3]'
    }));
    process.exit(1);
  }

  if (!fs.existsSync(PRODUCT_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${PRODUCT_DIR}/ directory not found. Run npx claude-kanban first.`
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
      { name: 'id', weight: 0.25 },        // ID includes domain (e.g., auth/login)
      { name: 'summary', weight: 0.2 },    // Summary is good context
      { name: 'domain', weight: 0.15 },    // Domain grouping
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
      path: result.item.path
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
