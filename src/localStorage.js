import { getLogger } from '@vcsuite/logger';

/** The key, to which must be appended `_{moduleId}`, used in the LocalStorage to hide the SplashScreen when user checked the 'Remember me' checkbox. The value must be the hashed config. */
export const hideSplashScreenKey = 'hideSplashScreen';

/**
 * @param {string} prefix The prefix to append to the key.
 * @param {string} key The key to obtain the value.
 * @returns {string|null} The value of the passed key, or null.
 */
export function getFromLocalStorage(prefix, key) {
  try {
    return localStorage.getItem(`${prefix}_${key}`);
  } catch (error) {
    getLogger().warning(
      `An error occured while getting the key "${key}": ${error}`,
    );
    return null;
  }
}

/**
 * Associates a value with the key in the LocalStorage.
 * @param {string} prefix The prefix to append to the key.
 * @param {string} key The key whose value must be defined.
 * @param {string} value The value to associate with the key.
 */
export function setToLocalStorage(prefix, key, value) {
  try {
    localStorage.setItem(`${prefix}_${key}`, value);
  } catch (error) {
    getLogger().warning(
      `An error occured while setting the key "${key}": ${error}`,
    );
  }
}

/**
 * Removes a key from the LocalStorage.
 * @param {string} prefix The prefix to append to the key.
 * @param {string} key The key to remove.
 */
export function removeFromLocalStorage(prefix, key) {
  try {
    localStorage.removeItem(`${prefix}_${key}`);
  } catch (error) {
    getLogger().warning(
      `An error occured while removing the key "${key}": ${error}`,
    );
  }
}
