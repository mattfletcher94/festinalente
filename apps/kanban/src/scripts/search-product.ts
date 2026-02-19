#!/usr/bin/env node

// Search product docs by keywords, ranked by relevance using fuzzy matching
// Usage: node search-product.cjs keyword1 keyword2 ... [--min-score=0.3]
// Returns JSON with ranked results
//
// Features:
// - Fuzzy search with Fuse.js
// - Searches: keywords, aliases, title, tldr, id, summary, domain, body
// - Boundary penalty: -0.15 if search term appears in boundary field

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
  tldr: string;
  summary: string;
  keywords: string[];
  aliases: string[];
  boundary: string;
  domain: string | null;
  body: string;
  path: string;
}

interface SearchResult {
  id: string;
  title: string;
  score: number;
  summary: string;
  tldr: string;
  path: string;
  boundaryPenalty: boolean;
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
      tldr: (frontmatter.tldr as string) || '',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
      boundary: (frontmatter.boundary as string) || '',
      domain: domain,
      body: body.slice(0, 1000), // First 1000 chars of body for searching
      path: normalizedPath
    });
  }

  return docs;
}

function checkBoundaryMatch(boundary: string, searchTerms: string[]): boolean {
  if (!boundary) return false;
  const boundaryLower = boundary.toLowerCase();
  for (const term of searchTerms) {
    if (boundaryLower.includes(term.toLowerCase())) {
      return true;
    }
  }
  return false;
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
      { name: 'keywords', weight: 0.35 },  // Reduced from 0.4
      { name: 'aliases', weight: 0.35 },   // NEW: Equal to keywords
      { name: 'title', weight: 0.25 },     // Reduced from 0.3
      { name: 'tldr', weight: 0.25 },      // NEW: High weight for concise summary
      { name: 'id', weight: 0.2 },         // Reduced from 0.25
      { name: 'summary', weight: 0.15 },   // Reduced from 0.2
      { name: 'domain', weight: 0.1 },     // Reduced from 0.15
      { name: 'body', weight: 0.05 }       // Reduced from 0.1 - too noisy
    ],
    threshold: 0.35,          // Tightened from 0.4
    includeScore: true,
    ignoreLocation: true,     // Match anywhere in the field
    useExtendedSearch: true,  // Enable extended search syntax
    findAllMatches: true
  });

  // Join search terms for combined search
  const query = searchTerms.join(' ');
  const fuseResults = fuse.search(query);

  // Convert Fuse results to our format with boundary penalty
  // Fuse score is 0 (perfect) to 1 (no match), we invert it
  const results: SearchResult[] = fuseResults
    .map(result => {
      const baseScore = 1 - (result.score || 0);
      const hasBoundaryMatch = checkBoundaryMatch(result.item.boundary, searchTerms);
      // Apply boundary penalty: reduce score by 0.15 if search term appears in boundary
      const adjustedScore = hasBoundaryMatch ? Math.max(0, baseScore - 0.15) : baseScore;

      return {
        id: result.item.id,
        title: result.item.title,
        score: Math.round(adjustedScore * 100) / 100,
        summary: result.item.summary,
        tldr: result.item.tldr,
        path: result.item.path,
        boundaryPenalty: hasBoundaryMatch
      };
    })
    .filter(result => result.score >= minScore)
    .sort((a, b) => b.score - a.score); // Re-sort after penalty

  const output = {
    query: searchTerms,
    count: results.length,
    docs: results
  };

  console.log(JSON.stringify(output, null, 2));
}

main();
