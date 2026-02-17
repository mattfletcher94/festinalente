/**
 * Terminal domain types.
 */

import type { TaskId } from '@/tasks';

/**
 * Terminal state.
 */
export type TerminalState =
  | { status: 'idle' }
  | { status: 'running'; taskId: TaskId | null };

/**
 * PTY data handler.
 */
export type PtyDataHandler = (data: string) => void;

/**
 * PTY exit handler.
 */
export type PtyExitHandler = (code: number) => void;
