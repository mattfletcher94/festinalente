/**
 * Settings feature - application preferences and persistence.
 */

// Types
export type { AppSettings, PanelSizes, ProjectSelectionResult } from './settings-types';

// Capability
export {
  createSettingsCapability,
  type CreateSettingsCapabilityReturn,
} from './settings.capability';

// Orchestrator
export {
  createSettingsOrchestrator,
  type CreateSettingsOrchestratorOptions,
  type CreateSettingsOrchestratorReturn,
} from './settings.orchestrator';

// Provider
export {
  injectSettings,
  provideSettings,
  SETTINGS_KEY,
  type SettingsContext,
} from './settings.provider';
