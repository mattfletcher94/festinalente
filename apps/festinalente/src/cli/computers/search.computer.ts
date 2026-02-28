/**
 * Search computer - pure functions for fuzzy search.
 *
 * @module cli/computers/search
 */

import Fuse from 'fuse.js';

/**
 * Search result with score.
 */
export interface SearchResult<T> {
  readonly item: T;
  readonly score: number;
}

/**
 * Search index configuration.
 */
export interface SearchConfig {
  readonly keys: readonly FuseKey[];
  readonly threshold?: number;
  readonly ignoreLocation?: boolean;
}

/**
 * Fuse key configuration.
 */
interface FuseKey {
  readonly name: string;
  readonly weight: number;
}

/**
 * Search computer interface.
 */
export interface SearchComputer {
  /**
   * Create a search index.
   *
   * @param items - Items to index.
   * @param config - Search configuration.
   * @returns A searchable index.
   */
  readonly createIndex: <T>(items: readonly T[], config: SearchConfig) => SearchIndex<T>;

  /**
   * Score results with OR-style matching.
   *
   * @param terms - Search terms.
   * @param index - Search index.
   * @returns Scored results.
   */
  readonly searchOrStyle: <T extends { id: string }>(
    terms: readonly string[],
    index: SearchIndex<T>
  ) => readonly SearchResult<T>[];

  /**
   * Check if search term appears in boundary field.
   *
   * @param boundary - The boundary string.
   * @param terms - Search terms.
   * @returns True if any term matches boundary.
   */
  readonly checkBoundaryMatch: (boundary: string, terms: readonly string[]) => boolean;
}

/**
 * Search index interface.
 */
export interface SearchIndex<T> {
  /**
   * Search for a term.
   *
   * @param term - The term to search.
   * @returns Search results.
   */
  readonly search: (term: string) => readonly SearchResult<T>[];
}

/**
 * Create a search computer.
 *
 * @returns A SearchComputer instance.
 */
export function createSearchComputer(): SearchComputer {
  function createIndex<T>(items: readonly T[], config: SearchConfig): SearchIndex<T> {
    const fuse = new Fuse(items as T[], {
      keys: config.keys.map((k) => ({ name: k.name, weight: k.weight })),
      threshold: config.threshold ?? 0.4,
      includeScore: true,
      ignoreLocation: config.ignoreLocation ?? true,
      findAllMatches: true,
    });

    return {
      search: (term: string): readonly SearchResult<T>[] => {
        const results = fuse.search(term);
        return results.map((r) => ({
          item: r.item,
          score: 1 - (r.score ?? 0), // Invert: 0=no match, 1=perfect
        }));
      },
    };
  }

  function searchOrStyle<T extends { id: string }>(
    terms: readonly string[],
    index: SearchIndex<T>
  ): readonly SearchResult<T>[] {
    // OR-style search: search each term independently and combine best scores
    const docScores = new Map<string, { item: T; scores: number[]; bestScore: number }>();

    for (const term of terms) {
      const termResults = index.search(term);
      for (const result of termResults) {
        const docId = result.item.id;

        if (!docScores.has(docId)) {
          docScores.set(docId, { item: result.item, scores: [], bestScore: 0 });
        }
        const entry = docScores.get(docId)!;
        entry.scores.push(result.score);
        entry.bestScore = Math.max(entry.bestScore, result.score);
      }
    }

    // Calculate combined score: weighted average favoring more matches
    return Array.from(docScores.values()).map((entry) => {
      const avgScore = entry.scores.reduce((a, b) => a + b, 0) / terms.length;
      const matchBonus = 1 + 0.1 * entry.scores.length;
      const combinedScore = Math.min(1, avgScore * matchBonus);

      return {
        item: entry.item,
        score: combinedScore,
      };
    });
  }

  function checkBoundaryMatch(boundary: string, terms: readonly string[]): boolean {
    if (!boundary) return false;
    const boundaryLower = boundary.toLowerCase();
    for (const term of terms) {
      if (boundaryLower.includes(term.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  return {
    createIndex,
    searchOrStyle,
    checkBoundaryMatch,
  };
}
