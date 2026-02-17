/**
 * Settings provider - Vue provide/inject wrapper for settings orchestrator.
 */

import { createContext } from '@/lib/utils';

import type { CreateSettingsOrchestratorReturn } from './settings.orchestrator';

export const [injectSettings, provideSettings, SETTINGS_KEY] =
  createContext<CreateSettingsOrchestratorReturn>('Settings');

export type { CreateSettingsOrchestratorReturn as SettingsContext };
