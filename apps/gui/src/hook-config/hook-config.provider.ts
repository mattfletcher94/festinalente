import { createContext } from '@/lib/utils';

import type { CreateHookConfigCapabilityReturn } from './hook-config.capability';

export const [injectHookConfig, provideHookConfig, HOOK_CONFIG_KEY] =
  createContext<CreateHookConfigCapabilityReturn>('HookConfig');

export type { CreateHookConfigCapabilityReturn as HookConfigContext };
