/**
 * Graph computer - pure functions for document relationship graph.
 *
 * Builds an adjacency list from docs' references/uses frontmatter
 * fields and provides O(1) 1-hop expansion for related doc discovery.
 *
 * @module cli/computers/graph
 */

/**
 * Minimal document interface for graph construction.
 *
 * Only the fields needed to build the adjacency list.
 */
export interface GraphDoc {
  readonly id: string;
  readonly references: readonly string[];
  readonly uses: readonly string[];
}

/**
 * A related document edge from graph expansion.
 */
export interface RelatedEdge {
  readonly id: string;
  readonly via: string;
}

/**
 * Pre-computed adjacency graph for O(1) neighbor lookup.
 */
export interface AdjacencyGraph {
  /**
   * Expand result IDs to 1-hop related docs.
   *
   * Returns neighbors not already in excludeIds, deduplicated
   * (first path wins for via field), sorted by id for determinism.
   *
   * @param resultIds - IDs of docs in main search results.
   * @param excludeIds - IDs to exclude (already in results).
   * @returns Related edges sorted by id.
   */
  readonly expand: (resultIds: readonly string[], excludeIds: ReadonlySet<string>) => readonly RelatedEdge[];
}

/**
 * Graph computer interface.
 *
 * Pure computer — no I/O. Receives doc data as input,
 * returns computed graph structures.
 */
export interface GraphComputer {
  /**
   * Build an adjacency graph from document relationship fields.
   *
   * @param docs - Documents with references and uses arrays.
   * @returns An adjacency graph for 1-hop expansion.
   */
  readonly buildGraph: (docs: readonly GraphDoc[]) => AdjacencyGraph;
}

/**
 * Create a graph computer for document relationship traversal.
 *
 * @returns A GraphComputer instance.
 */
export function createGraphComputer(): GraphComputer {
  function buildGraph(docs: readonly GraphDoc[]): AdjacencyGraph {
    const forward = new Map<string, Set<string>>();
    const backward = new Map<string, Set<string>>();
    const viaMap = new Map<string, Map<string, string>>();

    for (const doc of docs) {
      const docVia = new Map<string, string>();

      for (const ref of doc.references) {
        if (!forward.has(doc.id)) forward.set(doc.id, new Set());
        forward.get(doc.id)!.add(ref);
        docVia.set(ref, `${doc.id}.references`);

        if (!backward.has(ref)) backward.set(ref, new Set());
        backward.get(ref)!.add(doc.id);
      }

      for (const use of doc.uses) {
        if (!forward.has(doc.id)) forward.set(doc.id, new Set());
        forward.get(doc.id)!.add(use);
        if (!docVia.has(use)) docVia.set(use, `${doc.id}.uses`);

        if (!backward.has(use)) backward.set(use, new Set());
        backward.get(use)!.add(doc.id);
      }

      viaMap.set(doc.id, docVia);
    }

    function expand(resultIds: readonly string[], excludeIds: ReadonlySet<string>): readonly RelatedEdge[] {
      const seen = new Map<string, string>();

      for (const resultId of resultIds) {
        const fwd = forward.get(resultId);
        if (fwd) {
          for (const neighborId of fwd) {
            if (excludeIds.has(neighborId) || neighborId === resultId || seen.has(neighborId)) continue;
            seen.set(neighborId, viaMap.get(resultId)?.get(neighborId) ?? `${resultId}.references`);
          }
        }

        const bwd = backward.get(resultId);
        if (bwd) {
          for (const neighborId of bwd) {
            if (excludeIds.has(neighborId) || neighborId === resultId || seen.has(neighborId)) continue;
            seen.set(neighborId, viaMap.get(neighborId)?.get(resultId) ?? `${neighborId}.references`);
          }
        }
      }

      return Array.from(seen.entries())
        .map(([id, via]) => ({ id, via }))
        .sort((a, b) => a.id.localeCompare(b.id));
    }

    return { expand };
  }

  return { buildGraph };
}
