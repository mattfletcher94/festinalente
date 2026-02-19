#!/usr/bin/env node

// Expand search query using project glossary
// Usage: node expand-query.cjs keyword1 keyword2 ...
// Returns JSON with expanded query including aliases
//
// Reads .kanban/glossary.yaml and expands any matching terms

import fs from 'fs';
import yaml from 'js-yaml';

const GLOSSARY_FILE = '.kanban/glossary.yaml';

interface GlossaryTerm {
  term: string;
  aliases: string[];
  domain?: string;
  definition?: string;
}

interface Glossary {
  version?: number;
  terms: GlossaryTerm[];
}

interface ExpandQueryOutput {
  original: string[];
  expanded: string[];
  glossaryMatches: Array<{
    term: string;
    matchedOn: string;
    aliases: string[];
  }>;
}

function loadGlossary(): Glossary | null {
  if (!fs.existsSync(GLOSSARY_FILE)) {
    return null;
  }

  try {
    const content = fs.readFileSync(GLOSSARY_FILE, 'utf8');
    return yaml.load(content) as Glossary;
  } catch {
    return null;
  }
}

function expandQuery(terms: string[], glossary: Glossary): ExpandQueryOutput {
  const expanded = new Set<string>();
  const matches: ExpandQueryOutput['glossaryMatches'] = [];

  // Add all original terms
  for (const term of terms) {
    expanded.add(term.toLowerCase());
  }

  // Check each term against glossary
  for (const term of terms) {
    const termLower = term.toLowerCase();

    for (const entry of glossary.terms) {
      const entryTermLower = entry.term.toLowerCase();
      const aliasesLower = entry.aliases.map(a => a.toLowerCase());

      // Check if term matches the glossary term or any alias
      if (termLower === entryTermLower || aliasesLower.includes(termLower)) {
        // Add the main term and all aliases
        expanded.add(entryTermLower);
        for (const alias of entry.aliases) {
          expanded.add(alias.toLowerCase());
        }

        matches.push({
          term: entry.term,
          matchedOn: term,
          aliases: entry.aliases
        });
      }
    }
  }

  return {
    original: terms,
    expanded: Array.from(expanded),
    glossaryMatches: matches
  };
}

function main(): void {
  const terms = process.argv.slice(2);

  if (terms.length === 0) {
    console.log(JSON.stringify({
      error: true,
      message: 'Usage: expand-query.cjs keyword1 keyword2 ...'
    }));
    process.exit(1);
  }

  const glossary = loadGlossary();

  if (!glossary || !glossary.terms || glossary.terms.length === 0) {
    // No glossary, return original terms
    const output: ExpandQueryOutput = {
      original: terms,
      expanded: terms,
      glossaryMatches: []
    };
    console.log(JSON.stringify(output, null, 2));
    return;
  }

  const output = expandQuery(terms, glossary);
  console.log(JSON.stringify(output, null, 2));
}

main();
