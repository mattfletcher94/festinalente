import type { HookConfig } from './hook-config-types';

/**
 * Return type for the hook config capability.
 */
export interface CreateHookConfigCapabilityReturn {
  /**
   * Get configuration for a specific hook.
   *
   * @param projectPath - Path to the project directory.
   * @param hookName - The hook name (e.g., 'kanban-scope').
   * @returns Promise resolving to hook configuration.
   */
  getConfig(projectPath: string, hookName: string): Promise<HookConfig>;
}

/**
 * Create a hook config capability.
 *
 * @returns The hook config capability instance.
 */
export function createHookConfigCapability(): CreateHookConfigCapabilityReturn {
  async function getConfig(projectPath: string, hookName: string): Promise<HookConfig> {
    const result = await window.electronAPI.getHookConfig(projectPath, hookName);
    return { directives: result.directives };
  }

  return {
    getConfig,
  };
}
