/**
 * App provider - Vue provide/inject wrapper for app orchestrator.
 */

import { createContext } from '@/lib/utils';

import type { CreateAppOrchestratorReturn } from './app.orchestrator';

export const [injectApp, provideApp, APP_KEY] = createContext<CreateAppOrchestratorReturn>('App');

export type { CreateAppOrchestratorReturn as AppContext };
