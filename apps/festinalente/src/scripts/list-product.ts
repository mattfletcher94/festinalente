#!/usr/bin/env node

// List all product docs with optional filtering (recursive scan)
// Usage: node list-product.cjs [--type=X] [--domain=X]
// Returns JSON with array of product docs

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const PRODUCT_DIR = '.festinalente/product';

interface ParsedArgs {
  _: string[];
  type?: string;
  domain?: string;
  [key: string]: string | string[] | boolean | undefined;
}

interface ProductDoc {
  id: string;
  title: string;
  type: string;
  summary: string;
  keywords: string[];
  domain: string | null;
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
  // Get relative path from product dir
  const relativePath = path.relative(productDir, filePath).replace(/\\/g, '/');
  // Remove .md extension
  const withoutExt = relativePath.replace(/\.md$/, '');

  // Check if it's in a subdirectory (domain)
  const parts = withoutExt.split('/');
  if (parts.length === 1) {
    // Root level file (e.g., overview.md)
    return { id: parts[0], domain: null };
  } else {
    // Domain/file (e.g., auth/login.md -> auth/login)
    return { id: withoutExt, domain: parts[0] };
  }
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));

  if (!fs.existsSync(PRODUCT_DIR)) {
    console.log(JSON.stringify({
      error: true,
      message: `${PRODUCT_DIR}/ directory not found. Run npx claude-kanban first.`
    }));
    process.exit(1);
  }

  const files = scanRecursive(PRODUCT_DIR).sort();
  const docs: ProductDoc[] = [];

  for (const filePath of files) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    const content = fs.readFileSync(filePath, 'utf8');

    // Use gray-matter to parse frontmatter
    const { data: frontmatter } = matter(content);
    const { id, domain } = deriveIdAndDomain(filePath, PRODUCT_DIR);

    const doc: ProductDoc = {
      id: (frontmatter.id as string) || id,
      title: (frontmatter.title as string) || '',
      type: (frontmatter.type as string) || 'feature',
      summary: (frontmatter.summary as string) || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      domain: domain,
      path: normalizedPath
    };

    // Apply filters
    if (args.type && doc.type !== args.type) continue;
    if (args.domain && doc.domain !== args.domain) continue;

    docs.push(doc);
  }

  const result = {
    count: docs.length,
    docs: docs
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
