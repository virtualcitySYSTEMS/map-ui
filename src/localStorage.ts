import { getCaughtError } from '@vcmap/core';
import { getLogger } from '@vcsuite/logger';

/** The key, to which must be appended `_{moduleId}`, used in the LocalStorage to hide the SplashScreen when user checked the 'Remember me' checkbox. The value must be the hashed config. */
export const hideSplashScreenKey = 'hideSplashScreen';

/**
 * @param prefix The prefix to append to the key.
 * @param key The key to obtain the value.
 * @returns The value of the passed key, or null.
 */
export function getFromLocalStorage(
  prefix: string,
  key: string,
): string | null {
  try {
    return localStorage.getItem(`${prefix}_${key}`);
  } catch (error: unknown) {
    getLogger().warning(
      `An error occured while getting the key "${key}": ${getCaughtError(error).message}`,
    );
    return null;
  }
}

/**
 * Associates a value with the key in the LocalStorage.
 * @param prefix The prefix to append to the key.
 * @param key The key whose value must be defined.
 * @param value The value to associate with the key.
 */
export function setToLocalStorage(
  prefix: string,
  key: string,
  value: string,
): void {
  try {
    localStorage.setItem(`${prefix}_${key}`, value);
  } catch (error: unknown) {
    getLogger().warning(
      `An error occured while setting the key "${key}": ${getCaughtError(error).message}`,
    );
  }
}

/**
 * Removes a key from the LocalStorage.
 * @param prefix The prefix to append to the key.
 * @param key The key to remove.
 */
export function removeFromLocalStorage(prefix: string, key: string): void {
  try {
    localStorage.removeItem(`${prefix}_${key}`);
  } catch (error: unknown) {
    getLogger().warning(
      `An error occured while removing the key "${key}": ${getCaughtError(error).message}`,
    );
  }
}
