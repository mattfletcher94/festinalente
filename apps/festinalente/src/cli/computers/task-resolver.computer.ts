/**
 * Task resolver computer - pure functions for resolving task folder names
 * from numeric prefix-based identifiers.
 *
 * @module cli/computers/task-resolver
 */

/**
 * Task resolver computer interface.
 */
export interface TaskResolverComputer {
  /**
   * Resolve a task folder name from a list of folders using three-tier resolution:
   *
   * 1. **Exact match** - If `id` exactly matches a folder name, return it immediately.
   * 2. **Prefix-only resolution** - If `id` is digits-only (`/^\d+$/`), find the first
   *    folder whose numeric prefix matches.
   * 3. **No match** - Otherwise return `null`. This prevents mistyped full IDs
   *    (e.g. `"001-wrong-name"`) from silently resolving to an unrelated task.
   *
   * @param folders - The list of folder names to search.
   * @param id - The task identifier (full folder name or numeric prefix) to resolve.
   * @returns The matching folder name, or null if none match.
   */
  readonly resolveTaskFolder: (folders: readonly string[], id: string) => string | null;
}

/**
 * Create a task resolver computer.
 *
 * @returns A TaskResolverComputer instance.
 */
export function createTaskResolverComputer(): TaskResolverComputer {
  function resolveTaskFolder(folders: readonly string[], id: string): string | null {
    // Tier 1: Exact folder match
    if (folders.includes(id)) {
      return id;
    }

    // Tier 2: Prefix-only resolution (digits-only input)
    if (/^\d+$/.test(id)) {
      for (const folder of folders) {
        const folderMatch = folder.match(/^(\d+)/);
        if (folderMatch && folderMatch[1] === id) {
          return folder;
        }
      }
    }

    // Tier 3: No match
    return null;
  }

  return {
    resolveTaskFolder
  };
}
