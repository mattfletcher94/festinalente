/**
 * Claude settings capability - mechanism for reading Claude configuration files.
 *
 * Reads settings from .claude/settings.json at project and global levels.
 * Returns null on missing files or parse errors (silent degradation).
 */

import * as os from 'os';
import type { ClaudeSettings } from '../computers/claude-settings.computer';
import type { CreateFileSystemCapabilityReturn } from './file-system.capability';

/**
 * Return type for the Claude settings capability factory.
 */
export interface CreateClaudeSettingsCapabilityReturn {
  /**
   * Read Claude settings from the project's .claude/settings.json.
   *
   * @param workspaceRoot - The workspace root directory path.
   * @returns Parsed settings or null if file doesn't exist or is invalid.
   */
  readProjectSettings(workspaceRoot: string): ClaudeSettings | null;

  /**
   * Read Claude settings from the global ~/.claude/settings.json.
   *
   * @returns Parsed settings or null if file doesn't exist or is invalid.
   */
  readGlobalSettings(): ClaudeSettings | null;
}

/**
 * Create a Claude settings capability for reading configuration files.
 *
 * @param deps - Dependencies including file system capability.
 * @returns Capability with readProjectSettings and readGlobalSettings functions.
 */
export function createClaudeSettingsCapability(deps: {
  fs: CreateFileSystemCapabilityReturn;
}): CreateClaudeSettingsCapabilityReturn {
  const { fs } = deps;

  function readProjectSettings(workspaceRoot: string): ClaudeSettings | null {
    // Check settings.local.json first (takes precedence, typically gitignored)
    const localPath = fs.joinPath(workspaceRoot, '.claude', 'settings.local.json');
    if (fs.exists(localPath)) {
      try {
        const content = fs.readFile(localPath);
        return JSON.parse(content) as ClaudeSettings;
      } catch {
        // Fall through to settings.json
      }
    }

    // Fall back to settings.json
    const settingsPath = fs.joinPath(workspaceRoot, '.claude', 'settings.json');
    if (!fs.exists(settingsPath)) return null;

    try {
      const content = fs.readFile(settingsPath);
      return JSON.parse(content) as ClaudeSettings;
    } catch {
      return null;
    }
  }

  function readGlobalSettings(): ClaudeSettings | null {
    const settingsPath = fs.joinPath(os.homedir(), '.claude', 'settings.json');
    if (!fs.exists(settingsPath)) return null;

    try {
      const content = fs.readFile(settingsPath);
      return JSON.parse(content) as ClaudeSettings;
    } catch {
      return null;
    }
  }

  return { readProjectSettings, readGlobalSettings };
}
