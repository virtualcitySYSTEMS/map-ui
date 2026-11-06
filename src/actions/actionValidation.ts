import { is, optional, type Pattern } from '@vcsuite/check';
import type { VcsAction } from './actionHelper.js';

export const actionPattern: Pattern = {
  name: String,
  title: optional(String),
  icon: optional(String),
  callback: Function,
  active: optional(Boolean),
  background: optional(Boolean),
  hasUpdate: optional(Boolean),
  disabled: optional(Boolean),
};

export function validateAction(action: VcsAction): boolean {
  return is(action, actionPattern);
}

export function validateActions(actions: VcsAction[]): boolean {
  return actions.every(validateAction);
}
