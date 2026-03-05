/**
 * Claude settings computer - pure functions for YOLO mode detection.
 *
 * Determines whether Claude's "dangerous skip permissions" (YOLO) mode
 * is enabled based on settings from project and global configuration files.
 */

/**
 * Claude settings configuration shape.
 *
 * Supports two ways to enable YOLO mode:
 * - "dangerously-skip-permissions": true (strict equality)
 * - "defaultMode": "bypassPermissions" (exact string match)
 */
export interface ClaudeSettings {
  'dangerously-skip-permissions'?: boolean;
  'defaultMode'?: string;
}

/**
 * Return type for the Claude settings computer factory.
 */
export interface CreateClaudeSettingsComputerReturn {
  /**
   * Check if YOLO mode is enabled based on project and global settings.
   *
   * @param projectSettings - Settings from .claude/settings.json in workspace.
   * @param globalSettings - Settings from ~/.claude/settings.json.
   * @returns True if YOLO mode is enabled in either settings file (project takes precedence).
   */
  isYoloEnabled(projectSettings: ClaudeSettings | null, globalSettings: ClaudeSettings | null): boolean;
}

/**
 * Create a Claude settings computer for YOLO mode detection.
 *
 * @returns Computer with isYoloEnabled function.
 */
export function createClaudeSettingsComputer(): CreateClaudeSettingsComputerReturn {
  function isYoloEnabled(projectSettings: ClaudeSettings | null, globalSettings: ClaudeSettings | null): boolean {
    // Check project settings first (takes precedence per FR6)
    const settings = projectSettings ?? globalSettings;
    if (!settings) return false;

    // FR3: Check dangerously-skip-permissions with strict equality
    if (settings['dangerously-skip-permissions'] === true) return true;

    // FR4: Check defaultMode with exact string match
    if (settings.defaultMode === 'bypassPermissions') return true;

    return false;
  }

  return { isYoloEnabled };
}
