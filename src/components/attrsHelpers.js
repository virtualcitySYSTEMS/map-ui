import { is } from '@vcsuite/check';

/**
 * @param {Record<string, unknown>} attrs
 * @returns {Record<string, unknown>}
 */
// eslint-disable-next-line import/prefer-default-export
export function removeListenersFromAttrs(attrs) {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key, value]) => !(key.startsWith('on') && is(value, Function)),
    ),
  );
}
