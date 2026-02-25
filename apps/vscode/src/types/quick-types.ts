/**
 * Quick task type definitions.
 */

export type QuickStatus = 'in-progress' | 'completed';

export interface Quick {
  id: string;
  status: QuickStatus;
  title: string;
  problem: string;
  done: string;
  created: string;
  updated: string;
  quickPath: string;
}
