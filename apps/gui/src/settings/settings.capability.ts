/**
 * Settings capability - handles Electron IPC for settings operations.
 */

import type { AppSettings, PanelSizes, ProjectSelectionResult } from './settings-types';

/**
 * Return type for the settings capability.
 */
export interface CreateSettingsCapabilityReturn {
  /**
   * Get all settings.
   *
   * @returns Promise resolving to all settings.
   */
  getAllSettings(): Promise<AppSettings>;

  /**
   * Set the project path.
   *
   * @param path - The project path.
   */
  setProjectPath(path: string): Promise<void>;

  /**
   * Set the panel sizes.
   *
   * @param sizes - The panel sizes.
   */
  setPanelSizes(sizes: PanelSizes): Promise<void>;

  /**
   * Open the project picker dialog.
   *
   * @returns Promise resolving to selection result.
   */
  openProjectPicker(): Promise<ProjectSelectionResult>;
}

/**
 * Create a settings capability.
 *
 * @returns The settings capability instance.
 */
export function createSettingsCapability(): CreateSettingsCapabilityReturn {
  async function getAllSettings(): Promise<AppSettings> {
    const raw = await window.electronAPI.getAllSettings();
    return {
      projectPath: typeof raw.projectPath === 'string' ? raw.projectPath : undefined,
      panelSizes: raw.panelSizes ?? undefined,
    };
  }

  async function setProjectPath(path: string): Promise<void> {
    await window.electronAPI.setSetting('projectPath', path);
  }

  async function setPanelSizes(sizes: PanelSizes): Promise<void> {
    await window.electronAPI.setSetting('panelSizes', sizes);
  }

  async function openProjectPicker(): Promise<ProjectSelectionResult> {
    const raw = await window.electronAPI.openProject();
    return {
      canceled: raw.canceled ?? false,
      error: raw.error ?? undefined,
      projectPath: raw.projectPath ?? undefined,
    };
  }

  return {
    getAllSettings,
    setProjectPath,
    setPanelSizes,
    openProjectPicker,
  };
}
