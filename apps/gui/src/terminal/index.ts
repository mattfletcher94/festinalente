/**
 * Terminal feature - PTY management and command execution.
 */

// Types
export type { PtyDataHandler, PtyExitHandler, TerminalState } from './terminal-types';

// Computers
export {
  createTerminalCommandComputer,
  type CreateTerminalCommandComputerReturn,
} from './terminal-command.computer';

// Capability
export { createPtyCapability, type CreatePtyCapabilityReturn } from './pty.capability';

// Orchestrator
export {
  createTerminalOrchestrator,
  type CreateTerminalOrchestratorOptions,
  type CreateTerminalOrchestratorReturn,
  type TerminalWriter,
} from './terminal.orchestrator';

// Provider
export {
  injectTerminal,
  provideTerminal,
  TERMINAL_KEY,
  type TerminalContext,
} from './terminal.provider';
