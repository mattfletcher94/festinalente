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
   * Resolve a task folder name from a list of folders by matching
   * the numeric prefix of the given identifier.
   *
   * @param folders - The list of folder names to search.
   * @param id - The task identifier (or prefix) to resolve.
   * @returns The first matching folder name, or null if none match.
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
    const numericMatch = id.match(/^(\d+)/);
    if (!numericMatch) {
      return null;
    }
    const numericPrefix = numericMatch[1];

    for (const folder of folders) {
      const folderMatch = folder.match(/^(\d+)/);
      if (folderMatch && folderMatch[1] === numericPrefix) {
        return folder;
      }
    }

    return null;
  }

  return {
    resolveTaskFolder
  };
}
