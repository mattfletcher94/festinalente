/**
 * Quick task type definitions.
 */

export type QuickStatus = 'in-progress' | 'complete';

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
