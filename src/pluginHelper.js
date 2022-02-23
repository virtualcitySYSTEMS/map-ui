import { check } from '@vcsuite/check';

/**
 * validates the name according to package name pattern
 * @param {string} name
 * @returns {boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export function isValidPackageName(name) {
  check(name, String);

  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(name);
}
