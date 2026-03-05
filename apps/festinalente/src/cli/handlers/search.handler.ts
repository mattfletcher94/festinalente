/**
 * Search handler - commands for searching documentation.
 *
 * @module cli/handlers/search
 */

import type { CliCommand, CliResult } from '../types';
import type { SearchComputer, SearchConfig, SearchIndex } from '../computers/search.computer';
import { error, getNumberFlag, getStringFlag, parseArgs, success } from '../types';
import type { FileSystemCapability } from '../capabilities/file-system.capability';
import type { YamlParserComputer } from '../computers/yaml-parser.computer';
import { defineCommand } from '../registry';

const PRODUCT_DIR = '.festinalente/product';
const ENGINEERING_DIR = '.festinalente/engineering';
const DEFAULT_MIN_SCORE = 0.3;
const BODY_SLICE_LENGTH = 1000;
const BOUNDARY_PENALTY = 0.15;

/**
 * Internal document representation for search.
 */
interface InternalDoc {
  readonly id: string;
  readonly title: string;
  readonly type: string;
  readonly tldr: string;
  readonly summary: string;
  readonly keywords: readonly string[];
  readonly aliases: readonly string[];
  readonly boundary: string;
  readonly body: string;
  readonly path: string;
  readonly docType: 'product' | 'engineering';
  // Product-specific
  readonly domain: string | null;
  // Engineering-specific
  readonly system: string | null;
  readonly paths: readonly string[];
  // Relationship fields
  readonly references: readonly string[];
  readonly uses: readonly string[];
}

/**
 * Search result for product/engineering docs.
 */
export interface DocSearchResult {
  readonly id: string;
  readonly title: string;
  readonly score: number;
  readonly summary: string;
  readonly tldr: string;
  readonly path: string;
  readonly boundaryPenalty: boolean;
  readonly references: readonly string[];
  readonly uses: readonly string[];
}

/**
 * Related doc preview for 1-hop relationships.
 */
export interface RelatedDocPreview {
  readonly id: string;
  readonly tldr: string;
  readonly via: string;
}

/**
 * Search output for product/engineering.
 */
export interface SearchOutput {
  readonly query: readonly string[];
  readonly count: number;
  readonly docs: readonly DocSearchResult[];
  readonly relatedDocs: readonly RelatedDocPreview[];
}

/**
 * Match sources for hybrid search.
 */
export interface MatchSources {
  readonly exactKeyword: boolean;
  readonly exactAlias: boolean;
  readonly fuzzyTitle: number;
  readonly fuzzyTldr: number;
  readonly fuzzyBody: number;
}

/**
 * Hybrid search result.
 */
export interface HybridSearchResult {
  readonly id: string;
  readonly title: string;
  readonly score: number;
  readonly matchSources: MatchSources;
  readonly boundaryPenalty: number;
  readonly path: string;
  readonly docType: 'product' | 'engineering';
  readonly tldr: string;
  readonly summary: string;
}

/**
 * Hybrid search output.
 */
export interface HybridSearchOutput {
  readonly query: readonly string[];
  readonly results: readonly HybridSearchResult[];
}

/**
 * Reverse lookup output.
 */
export interface ReverseLookupOutput {
  readonly id: string;
  readonly referencedBy: readonly RelatedDocPreview[];
  readonly usedBy: readonly RelatedDocPreview[];
}

/**
 * Dependencies for search handler.
 */
export interface SearchHandlerDeps {
  readonly fs: FileSystemCapability;
  readonly yamlParser: YamlParserComputer;
  readonly search: SearchComputer;
}

/**
 * Search handler interface.
 */
export interface SearchHandler {
  readonly searchProduct: (args: string[]) => CliResult<SearchOutput>;
  readonly searchEngineering: (args: string[]) => CliResult<SearchOutput>;
  readonly searchHybrid: (args: string[]) => CliResult<HybridSearchOutput>;
  readonly reverseLookup: (args: string[]) => CliResult<ReverseLookupOutput>;
  readonly getCommands: () => readonly CliCommand[];
}

/**
 * Create a search handler.
 *
 * @param deps - The dependencies.
 * @returns A SearchHandler instance.
 */
export function createSearchHandler(deps: SearchHandlerDeps): SearchHandler {
  const { fs, yamlParser, search } = deps;

  /**
   * Derive ID and domain from product file path.
   */
  function deriveProductIdAndDomain(filePath: string): { id: string; domain: string | null } {
    const relativePath = fs.relativePath(PRODUCT_DIR, filePath).replace(/\\/g, '/');
    const withoutExt = relativePath.replace(/\.md$/, '');
    const parts = withoutExt.split('/');

    if (parts.length === 1) {
      return { id: parts[0], domain: null };
    }
    return { id: withoutExt, domain: parts[0] };
  }

  /**
   * Derive ID and system from engineering file path.
   */
  function deriveEngineeringIdAndSystem(filePath: string): { id: string; system: string | null } {
    const relativePath = fs.relativePath(ENGINEERING_DIR, filePath).replace(/\\/g, '/');
    const withoutExt = relativePath.replace(/\.md$/, '');
    const parts = withoutExt.split('/');

    if (parts.length === 1) {
      return { id: parts[0], system: null };
    }

    if (parts[0] === 'systems') {
      if (parts.length === 3 && parts[2] === '_index') {
        return { id: `${parts[0]}/${parts[1]}`, system: null };
      } else if (parts.length === 3) {
        return { id: withoutExt, system: parts[1] };
      } else if (parts.length === 2) {
        return { id: withoutExt, system: null };
      }
    }

    return { id: withoutExt, system: null };
  }

  /**
   * Load documents from a directory.
   */
  function loadDocs(
    dir: string,
    docType: 'product' | 'engineering'
  ): readonly InternalDoc[] {
    const scanResult = fs.scanRecursive(dir, '.md');
    if (!scanResult.ok) return [];

    const docs: InternalDoc[] = [];

    for (const filePath of scanResult.value) {
      const normalizedPath = filePath.replace(/\\/g, '/');
      const readResult = fs.readFile(filePath);
      if (!readResult.ok) continue;

      const { data: frontmatter, content: body } = yamlParser.parseFrontmatter(readResult.value);

      let id: string;
      let domain: string | null = null;
      let system: string | null = null;

      if (docType === 'product') {
        const derived = deriveProductIdAndDomain(filePath);
        id = (frontmatter.id as string) || derived.id;
        domain = derived.domain;
      } else {
        const derived = deriveEngineeringIdAndSystem(filePath);
        id = (frontmatter.id as string) || derived.id;
        system = derived.system;
      }

      docs.push({
        id,
        title: (frontmatter.title as string) || '',
        type: (frontmatter.type as string) || (docType === 'product' ? 'feature' : 'pattern'),
        tldr: (frontmatter.tldr as string) || '',
        summary: (frontmatter.summary as string) || '',
        keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
        aliases: Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [],
        boundary: (frontmatter.boundary as string) || '',
        body: body.slice(0, BODY_SLICE_LENGTH),
        path: normalizedPath,
        docType,
        domain,
        system,
        paths: Array.isArray(frontmatter.paths) ? frontmatter.paths : [],
        references: Array.isArray(frontmatter.references) ? frontmatter.references : [],
        uses: Array.isArray(frontmatter.uses) ? frontmatter.uses : [],
      });
    }

    return docs;
  }

  /**
   * Get search config for product docs.
   */
  function getProductSearchConfig(): SearchConfig {
    return {
      keys: [
        { name: 'keywords', weight: 0.35 },
        { name: 'aliases', weight: 0.35 },
        { name: 'title', weight: 0.25 },
        { name: 'tldr', weight: 0.25 },
        { name: 'id', weight: 0.2 },
        { name: 'summary', weight: 0.15 },
        { name: 'domain', weight: 0.1 },
        { name: 'body', weight: 0.05 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    };
  }

  /**
   * Get search config for engineering docs.
   */
  function getEngineeringSearchConfig(): SearchConfig {
    return {
      keys: [
        { name: 'keywords', weight: 0.35 },
        { name: 'aliases', weight: 0.35 },
        { name: 'title', weight: 0.25 },
        { name: 'tldr', weight: 0.25 },
        { name: 'id', weight: 0.2 },
        { name: 'summary', weight: 0.15 },
        { name: 'system', weight: 0.1 },
        { name: 'paths', weight: 0.1 },
        { name: 'body', weight: 0.05 },
      ],
      threshold: 0.4,
      ignoreLocation: true,
    };
  }

  /**
   * Execute search on docs.
   */
  function executeSearch(
    docs: readonly InternalDoc[],
    searchTerms: readonly string[],
    config: SearchConfig,
    minScore: number
  ): { results: readonly DocSearchResult[]; relatedDocs: readonly RelatedDocPreview[] } {
    if (docs.length === 0) return { results: [], relatedDocs: [] };

    const index = search.createIndex(docs, config);
    const searchResults = search.searchOrStyle(searchTerms, index as SearchIndex<InternalDoc & { id: string }>);

    const results = searchResults
      .map((result) => {
        const doc = result.item;
        const baseScore = result.score;
        const hasBoundaryMatch = search.checkBoundaryMatch(doc.boundary, searchTerms);
        const adjustedScore = hasBoundaryMatch
          ? Math.max(0, baseScore - BOUNDARY_PENALTY)
          : baseScore;

        return {
          id: doc.id,
          title: doc.title,
          score: Math.round(adjustedScore * 100) / 100,
          summary: doc.summary,
          tldr: doc.tldr,
          path: doc.path,
          boundaryPenalty: hasBoundaryMatch,
          references: doc.references,
          uses: doc.uses,
        };
      })
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score);

    // Collect related docs (1-hop only)
    const relatedIds = new Set<string>();
    const relatedVia = new Map<string, string>();

    for (const result of results) {
      for (const refId of result.references) {
        if (!results.some((r) => r.id === refId)) {
          relatedIds.add(refId);
          relatedVia.set(refId, `${result.id}.references`);
        }
      }
      for (const useId of result.uses) {
        if (!results.some((r) => r.id === useId)) {
          relatedIds.add(useId);
          relatedVia.set(useId, `${result.id}.uses`);
        }
      }
    }

    // Look up tldr for related docs
    const relatedDocs: RelatedDocPreview[] = [];
    for (const relId of relatedIds) {
      const doc = docs.find((d) => d.id === relId);
      if (doc) {
        relatedDocs.push({
          id: relId,
          tldr: doc.tldr,
          via: relatedVia.get(relId) || '',
        });
      }
    }

    return { results, relatedDocs };
  }

  /**
   * Search product docs command.
   */
  function searchProduct(args: string[]): CliResult<SearchOutput> {
    const parsed = parseArgs(args);
    const searchTerms = parsed.positional;
    const minScore = getNumberFlag(parsed.flags, 'min-score') ?? DEFAULT_MIN_SCORE;

    if (searchTerms.length === 0) {
      return error('Usage: search-product keyword1 keyword2 ... [--min-score=0.3]');
    }

    if (!fs.exists(PRODUCT_DIR)) {
      return error(`${PRODUCT_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const docs = loadDocs(PRODUCT_DIR, 'product');
    const { results, relatedDocs } = executeSearch(docs, searchTerms, getProductSearchConfig(), minScore);

    return success({
      query: searchTerms,
      count: results.length,
      docs: results,
      relatedDocs,
    });
  }

  /**
   * Search engineering docs command.
   */
  function searchEngineering(args: string[]): CliResult<SearchOutput> {
    const parsed = parseArgs(args);
    const searchTerms = parsed.positional;
    const minScore = getNumberFlag(parsed.flags, 'min-score') ?? DEFAULT_MIN_SCORE;

    if (searchTerms.length === 0) {
      return error('Usage: search-engineering keyword1 keyword2 ... [--min-score=0.3]');
    }

    if (!fs.exists(ENGINEERING_DIR)) {
      return error(`${ENGINEERING_DIR}/ directory not found. Run npx festinalente first.`);
    }

    const docs = loadDocs(ENGINEERING_DIR, 'engineering');
    const { results, relatedDocs } = executeSearch(docs, searchTerms, getEngineeringSearchConfig(), minScore);

    return success({
      query: searchTerms,
      count: results.length,
      docs: results,
      relatedDocs,
    });
  }

  /**
   * Check exact match in terms.
   */
  function checkExactMatch(terms: readonly string[], searchTerms: readonly string[]): boolean {
    const lowerSearchTerms = searchTerms.map((t) => t.toLowerCase());
    for (const term of terms) {
      if (lowerSearchTerms.includes(term.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Run fuzzy search on specific fields.
   */
  function runFieldFuzzySearch(
    docs: readonly InternalDoc[],
    searchTerms: readonly string[],
    field: 'title' | 'tldr' | 'body',
    threshold: number
  ): Map<string, number> {
    const results = new Map<string, number>();
    for (const doc of docs) {
      results.set(doc.id, 0);
    }

    const config: SearchConfig = {
      keys: [{ name: field, weight: 1 }],
      threshold,
      ignoreLocation: true,
    };

    const index = search.createIndex(docs, config);
    const query = searchTerms.join(' ');
    const searchResults = index.search(query);

    for (const result of searchResults) {
      results.set(result.item.id, result.score);
    }

    return results;
  }

  /**
   * Search hybrid command.
   */
  function searchHybrid(args: string[]): CliResult<HybridSearchOutput> {
    const parsed = parseArgs(args);
    const searchTerms = parsed.positional;
    const minScore = getNumberFlag(parsed.flags, 'min-score') ?? DEFAULT_MIN_SCORE;
    const docTypeFilter = getStringFlag(parsed.flags, 'type') as 'product' | 'engineering' | undefined;

    if (searchTerms.length === 0) {
      return error(
        'Usage: search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]'
      );
    }

    // Load docs based on filter
    let docs: InternalDoc[] = [];

    if (!docTypeFilter || docTypeFilter === 'product') {
      if (fs.exists(PRODUCT_DIR)) {
        docs = docs.concat(loadDocs(PRODUCT_DIR, 'product') as InternalDoc[]);
      }
    }

    if (!docTypeFilter || docTypeFilter === 'engineering') {
      if (fs.exists(ENGINEERING_DIR)) {
        docs = docs.concat(loadDocs(ENGINEERING_DIR, 'engineering') as InternalDoc[]);
      }
    }

    if (docs.length === 0) {
      return success({
        query: searchTerms,
        results: [],
      });
    }

    // Run fuzzy search on each field
    const titleScores = runFieldFuzzySearch(docs, searchTerms, 'title', 0.4);
    const tldrScores = runFieldFuzzySearch(docs, searchTerms, 'tldr', 0.4);
    const bodyScores = runFieldFuzzySearch(docs, searchTerms, 'body', 0.5);

    // Calculate combined scores
    const results: HybridSearchResult[] = [];

    for (const doc of docs) {
      const exactKeyword = checkExactMatch(doc.keywords, searchTerms);
      const exactAlias = checkExactMatch(doc.aliases, searchTerms);
      const fuzzyTitle = titleScores.get(doc.id) ?? 0;
      const fuzzyTldr = tldrScores.get(doc.id) ?? 0;
      const fuzzyBody = bodyScores.get(doc.id) ?? 0;
      const boundaryPenalty = search.checkBoundaryMatch(doc.boundary, searchTerms) ? BOUNDARY_PENALTY : 0;

      // Calculate combined score
      let score = 0;
      if (exactKeyword) score += 0.3;
      if (exactAlias) score += 0.25;
      score += fuzzyTitle * 0.2;
      score += fuzzyTldr * 0.15;
      score += fuzzyBody * 0.1;

      // Apply boundary penalty
      score = Math.max(0, score - boundaryPenalty);

      // Only include if score meets threshold or has exact matches
      if (score >= minScore || exactKeyword || exactAlias) {
        results.push({
          id: doc.id,
          title: doc.title,
          score: Math.round(score * 100) / 100,
          matchSources: {
            exactKeyword,
            exactAlias,
            fuzzyTitle: Math.round(fuzzyTitle * 100) / 100,
            fuzzyTldr: Math.round(fuzzyTldr * 100) / 100,
            fuzzyBody: Math.round(fuzzyBody * 100) / 100,
          },
          boundaryPenalty: Math.round(boundaryPenalty * 100) / 100,
          path: doc.path,
          docType: doc.docType,
          tldr: doc.tldr,
          summary: doc.summary,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return success({
      query: searchTerms,
      results,
    });
  }

  /**
   * Reverse lookup command - find docs that reference a given ID.
   */
  function reverseLookup(args: string[]): CliResult<ReverseLookupOutput> {
    const parsed = parseArgs(args);

    if (parsed.positional.length === 0) {
      return error('Usage: reverse-lookup <doc-id>');
    }

    const targetId = parsed.positional[0];

    // Load all docs
    const productDocs = fs.exists(PRODUCT_DIR) ? loadDocs(PRODUCT_DIR, 'product') : [];
    const engineeringDocs = fs.exists(ENGINEERING_DIR) ? loadDocs(ENGINEERING_DIR, 'engineering') : [];
    const allDocs = [...productDocs, ...engineeringDocs];

    const referencedBy: RelatedDocPreview[] = [];
    const usedBy: RelatedDocPreview[] = [];

    for (const doc of allDocs) {
      if (doc.references.includes(targetId)) {
        referencedBy.push({ id: doc.id, tldr: doc.tldr, via: 'references' });
      }
      if (doc.uses.includes(targetId)) {
        usedBy.push({ id: doc.id, tldr: doc.tldr, via: 'uses' });
      }
    }

    return success({ id: targetId, referencedBy, usedBy });
  }

  /**
   * Get command definitions.
   */
  function getCommands(): readonly CliCommand[] {
    return [
      defineCommand(
        'search-product',
        'Search product docs by keywords',
        'search-product keyword1 keyword2 ... [--min-score=0.3]',
        searchProduct
      ),
      defineCommand(
        'search-engineering',
        'Search engineering docs by keywords',
        'search-engineering keyword1 keyword2 ... [--min-score=0.3]',
        searchEngineering
      ),
      defineCommand(
        'search-hybrid',
        'Hybrid search combining exact and fuzzy matching',
        'search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]',
        searchHybrid
      ),
      defineCommand(
        'reverse-lookup',
        'Find docs that reference a given doc ID',
        'reverse-lookup <doc-id>',
        reverseLookup
      ),
    ];
  }

  return {
    searchProduct,
    searchEngineering,
    searchHybrid,
    reverseLookup,
    getCommands,
  };
}
