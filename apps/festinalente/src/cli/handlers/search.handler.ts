/**
 * Search handler - commands for searching documentation.
 *
 * @module cli/handlers/search
 */

import type { CliCommand, CliResult } from '../types';
import type { SearchComputer, SearchConfig } from '../computers/search.computer';
import type { GraphComputer } from '../computers/graph.computer';
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
  readonly graph: GraphComputer;
}

/**
 * Search handler interface.
 */
export interface SearchHandler {
  readonly searchProduct: (args: string[]) => CliResult<SearchOutput>;
  readonly searchEngineering: (args: string[]) => CliResult<SearchOutput>;
  readonly searchHybrid: (args: string[]) => CliResult<SearchOutput>;
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
  const { fs, yamlParser, search, graph } = deps;

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
  function loadDocs(dir: string, docType: 'product' | 'engineering'): readonly InternalDoc[] {
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
        uses: Array.isArray(frontmatter.uses) ? frontmatter.uses : []
      });
    }

    return docs;
  }

  /**
   * Get search config for product docs.
   */
  function getProductSearchConfig(): SearchConfig {
    return {
      fields: ['keywords', 'aliases', 'title', 'tldr', 'id', 'summary', 'domain', 'body'],
      boosts: { keywords: 7, aliases: 7, title: 5, tldr: 5, id: 4, summary: 3, domain: 2, body: 1 }
    };
  }

  /**
   * Get search config for engineering docs.
   */
  function getEngineeringSearchConfig(): SearchConfig {
    return {
      fields: ['keywords', 'aliases', 'title', 'tldr', 'id', 'summary', 'system', 'paths', 'body'],
      boosts: { keywords: 7, aliases: 7, title: 5, tldr: 5, id: 4, summary: 3, system: 2, paths: 2, body: 1 }
    };
  }

  /**
   * Get unified search config for hybrid search (all fields).
   */
  function getHybridSearchConfig(): SearchConfig {
    return {
      fields: ['keywords', 'aliases', 'title', 'tldr', 'id', 'summary', 'domain', 'system', 'paths', 'body'],
      boosts: { keywords: 7, aliases: 7, title: 5, tldr: 5, id: 4, summary: 3, domain: 2, system: 2, paths: 2, body: 1 }
    };
  }

  /**
   * Build graph-expanded related docs from search results.
   */
  function buildRelatedDocs(docs: readonly InternalDoc[], resultIds: readonly string[]): readonly RelatedDocPreview[] {
    const adjacency = graph.buildGraph(docs);
    const excludeIds = new Set(resultIds);
    const edges = adjacency.expand(resultIds, excludeIds);
    const docsById = new Map(docs.map((d) => [d.id, d]));

    return edges
      .map((edge) => {
        const doc = docsById.get(edge.id);
        return doc ? { id: edge.id, tldr: doc.tldr, via: edge.via } : undefined;
      })
      .filter((r): r is RelatedDocPreview => r !== undefined);
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
    const searchResults = index.search(searchTerms);

    const results = searchResults
      .map((result) => {
        const doc = result.item;
        const baseScore = result.score;
        const hasBoundaryMatch = search.checkBoundaryMatch(doc.boundary, searchTerms);
        const adjustedScore = hasBoundaryMatch ? Math.max(0, baseScore - BOUNDARY_PENALTY) : baseScore;

        return {
          id: doc.id,
          title: doc.title,
          score: Math.round(adjustedScore * 100) / 100,
          summary: doc.summary,
          tldr: doc.tldr,
          path: doc.path,
          boundaryPenalty: hasBoundaryMatch,
          references: doc.references,
          uses: doc.uses
        };
      })
      .filter((result) => result.score >= minScore)
      .sort((a, b) => b.score - a.score);

    const relatedDocs = buildRelatedDocs(
      docs,
      results.map((r) => r.id)
    );

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
      relatedDocs
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
      relatedDocs
    });
  }

  /**
   * Search hybrid command - unified search across product and engineering docs.
   */
  function searchHybrid(args: string[]): CliResult<SearchOutput> {
    const parsed = parseArgs(args);
    const searchTerms = parsed.positional;
    const minScore = getNumberFlag(parsed.flags, 'min-score') ?? DEFAULT_MIN_SCORE;
    const docTypeFilter = getStringFlag(parsed.flags, 'type') as 'product' | 'engineering' | undefined;

    if (searchTerms.length === 0) {
      return error('Usage: search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]');
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
        count: 0,
        docs: [],
        relatedDocs: []
      });
    }

    const { results, relatedDocs } = executeSearch(docs, searchTerms, getHybridSearchConfig(), minScore);

    return success({
      query: searchTerms,
      count: results.length,
      docs: results,
      relatedDocs
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
        'Hybrid search combining BM25+ scoring across all doc types',
        'search-hybrid keyword1 keyword2 ... [--type=product|engineering] [--min-score=0.3]',
        searchHybrid
      ),
      defineCommand(
        'reverse-lookup',
        'Find docs that reference a given doc ID',
        'reverse-lookup <doc-id>',
        reverseLookup
      )
    ];
  }

  return {
    searchProduct,
    searchEngineering,
    searchHybrid,
    reverseLookup,
    getCommands
  };
}
