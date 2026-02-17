/**
 * Terminal provider - Vue provide/inject wrapper for terminal orchestrator.
 */

import { createContext } from '@/lib/utils';

import type { CreateTerminalOrchestratorReturn } from './terminal.orchestrator';

export const [injectTerminal, provideTerminal, TERMINAL_KEY] =
  createContext<CreateTerminalOrchestratorReturn>('Terminal');

export type { CreateTerminalOrchestratorReturn as TerminalContext };
