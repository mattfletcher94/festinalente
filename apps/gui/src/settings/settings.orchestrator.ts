/**
 * Settings orchestrator - coordinates application settings state.
 */

import { ref, type Ref } from 'vue';

import type { CreateSettingsCapabilityReturn } from './settings.capability';
import type { PanelSizes } from './settings-types';

/**
 * Default panel sizes.
 */
const DEFAULT_PANEL_SIZES: PanelSizes = {
  taskList: 20,
  taskDetail: 40,
  terminal: 40,
};

/**
 * Options for creating a settings orchestrator.
 */
export interface CreateSettingsOrchestratorOptions {
  /**
   * The settings capability.
   */
  readonly settings: CreateSettingsCapabilityReturn;
}

/**
 * Return type for the settings orchestrator.
 */
export interface CreateSettingsOrchestratorReturn {
  // State
  readonly projectPath: Ref<string | null>;
  readonly panelSizes: Ref<PanelSizes>;
  readonly loaded: Ref<boolean>;

  // Actions
  load(): Promise<void>;
  setProjectPath(path: string): Promise<void>;
  setPanelSizes(sizes: PanelSizes): Promise<void>;
  openProjectPicker(): Promise<string | null>;
}

/**
 * Create a settings orchestrator.
 *
 * @param options - Configuration options.
 * @returns The settings orchestrator instance.
 */
export function createSettingsOrchestrator(
  options: CreateSettingsOrchestratorOptions
): CreateSettingsOrchestratorReturn {
  const { settings } = options;

  // State
  const projectPath = ref<string | null>(null);
  const panelSizes = ref<PanelSizes>({ ...DEFAULT_PANEL_SIZES });
  const loaded = ref(false);

  // Actions
  async function load(): Promise<void> {
    const allSettings = await settings.getAllSettings();

    if (allSettings.projectPath !== undefined) {
      projectPath.value = allSettings.projectPath;
    }

    if (allSettings.panelSizes !== undefined) {
      panelSizes.value = allSettings.panelSizes;
    }

    loaded.value = true;
  }

  async function setProjectPath(path: string): Promise<void> {
    projectPath.value = path;
    await settings.setProjectPath(path);
  }

  async function setPanelSizes(sizes: PanelSizes): Promise<void> {
    panelSizes.value = sizes;
    await settings.setPanelSizes(sizes);
  }

  async function openProjectPicker(): Promise<string | null> {
    const result = await settings.openProjectPicker();
    if (result.canceled || result.error !== undefined || result.projectPath === undefined) {
      return null;
    }
    return result.projectPath;
  }

  return {
    // State
    projectPath,
    panelSizes,
    loaded,

    // Actions
    load,
    setProjectPath,
    setPanelSizes,
    openProjectPicker,
  };
}
