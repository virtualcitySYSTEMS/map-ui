import { is } from '@vcsuite/check';

export function removeListenersFromAttrs(
  attrs: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(attrs).filter(
      ([key, value]): boolean => !(key.startsWith('on') && is(value, Function)),
    ),
  );
}
