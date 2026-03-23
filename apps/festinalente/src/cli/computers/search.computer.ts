/**
 * Search computer - pure functions for BM25+ search.
 *
 * Uses MiniSearch for inverted index with BM25+ scoring,
 * field boosting, prefix search, and native OR-mode combining.
 *
 * @module cli/computers/search
 */

import MiniSearch from 'minisearch';

/**
 * Search result with normalized 0-1 score.
 */
export interface SearchResult<T> {
  readonly item: T;
  readonly score: number;
}

/**
 * Search index configuration with field boosts.
 *
 * Fields are indexed by MiniSearch. Boosts control relative
 * importance at search time (higher = more important).
 */
export interface SearchConfig {
  readonly fields: readonly string[];
  readonly boosts: Readonly<Record<string, number>>;
}

/**
 * Search computer interface.
 *
 * Provides BM25+ search with field boosting, prefix matching,
 * and score normalization. Pure — no I/O.
 */
export interface SearchComputer {
  /**
   * Create a search index from items.
   *
   * @param items - Items to index (must have string id field).
   * @param config - Field names and boost weights.
   * @returns A searchable index with normalized scoring.
   */
  readonly createIndex: <T extends { readonly id: string }>(
    items: readonly T[],
    config: SearchConfig
  ) => SearchIndex<T>;

  /**
   * Check if any search term appears in a boundary string.
   *
   * @param boundary - The boundary field value.
   * @param terms - Search terms to check.
   * @returns True if any term is found in boundary (case-insensitive).
   */
  readonly checkBoundaryMatch: (boundary: string, terms: readonly string[]) => boolean;
}

/**
 * Search index for querying indexed documents.
 */
export interface SearchIndex<T> {
  /**
   * Search for terms using OR-mode combining with BM25+ scoring.
   *
   * @param terms - Search terms (combined with OR logic).
   * @returns Results with scores normalized to 0-1 range.
   */
  readonly search: (terms: readonly string[]) => readonly SearchResult<T>[];
}

/**
 * Normalize BM25 scores to 0-1 range by dividing by max score.
 *
 * Preserves relative ranking. Returns empty array for empty input.
 * Guards against division by zero when max score is 0.
 *
 * @param results - Raw scored results from MiniSearch.
 * @returns Results with scores in 0-1 range.
 */
function normalizeScores<T>(results: readonly SearchResult<T>[]): readonly SearchResult<T>[] {
  if (results.length === 0) return [];
  const maxScore = results.reduce((max, r) => (r.score > max ? r.score : max), 0);
  if (maxScore <= 0) return results;
  return results.map((r) => ({ item: r.item, score: r.score / maxScore }));
}

/**
 * Create a search computer using MiniSearch BM25+ scoring.
 *
 * @returns A SearchComputer instance with BM25+ indexing and normalized scoring.
 */
export function createSearchComputer(): SearchComputer {
  function createIndex<T extends { readonly id: string }>(
    items: readonly T[],
    config: SearchConfig
  ): SearchIndex<T> {
    const itemsById = new Map(items.map((item) => [item.id, item]));

    const miniSearch = new MiniSearch<T>({
      fields: [...config.fields],
      idField: 'id',
      extractField: (document: T, fieldName: string): string => {
        const value = (document as Record<string, unknown>)[fieldName];
        if (Array.isArray(value)) return value.join(' ');
        return typeof value === 'string' ? value : '';
      }
    });

    for (const item of items) {
      try {
        miniSearch.add(item);
      } catch {
        console.warn(`Skipping malformed doc during indexing: ${item.id}`);
      }
    }

    return {
      search: (terms: readonly string[]): readonly SearchResult<T>[] => {
        const query = terms.join(' ');
        if (!query.trim()) return [];

        const results = miniSearch.search(query, {
          boost: { ...config.boosts },
          combineWith: 'OR',
          prefix: true,
          fuzzy: 0.2
        });

        const scored = results
          .map((r) => {
            const item = itemsById.get(String(r.id));
            return item ? { item, score: r.score } : undefined;
          })
          .filter((r): r is SearchResult<T> => r !== undefined);

        return normalizeScores(scored);
      }
    };
  }

  function checkBoundaryMatch(boundary: string, terms: readonly string[]): boolean {
    if (!boundary) return false;
    const boundaryLower = boundary.toLowerCase();
    return terms.some((term) => boundaryLower.includes(term.toLowerCase()));
  }

  return { createIndex, checkBoundaryMatch };
}
