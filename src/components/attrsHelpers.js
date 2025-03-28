import { is } from '@vcsuite/check';

/**
 * @param {Record<string, unknown>} attrs
 * @returns {Record<string, unknown>}
 */

export function removeListenersFromAttrs(attrs) {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key, value]) => !(key.startsWith('on') && is(value, Function)),
    ),
  );
}
