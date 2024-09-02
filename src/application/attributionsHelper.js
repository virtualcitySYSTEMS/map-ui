import { reactive } from 'vue';
import { ObliqueMap } from '@vcmap/core';

/**
 * @typedef {Object} AttributionOptions
 * @property {string} provider - name of the data provider
 * @property {number} [year] - year of dataset
 * @property {string} url - link to data provider
 */

/**
 * @typedef {Object} AttributionEntry
 * @property {string} key - name of the VcsObject the attribution applies to
 * @property {string} title - title of the VcsObject the attribution applies to
 * @property {AttributionOptions|Array<AttributionOptions>} attributions - attributions of a map, layer or oblique collection
 */

/**
 * merges attribution entries of same providers
 * @param {Array<AttributionEntry>} entries
 * @returns {Array<{provider: string, years: string, url: string}>}
 */
export function mergeAttributions(entries) {
  const providers = {};
  entries.forEach(({ attributions }) => {
    attributions.forEach(({ provider, year, url }) => {
      const providerObject = providers[provider];
      if (providerObject) {
        if (year) {
          const index = providerObject.years.indexOf(year);
          if (url && index === -1) {
            if (providerObject.years.every((y) => Number(y) < Number(year))) {
              providerObject.url = url;
            }
            if (year) {
              const set = new Set([...providerObject.years, Number(year)]);
              providerObject.years = [...set].sort((a, b) => a - b);
            }
          }
        }
      } else {
        providers[provider] = {
          years: year ? [Number(year)] : [],
          url,
        };
      }
    });
  });
  return Object.keys(providers).map((provider) => ({
    provider,
    years: providers[provider].years.join(', '),
    url: providers[provider].url,
  }));
}

/**
 * Gets attributions of all active maps, layers and oblique collections and returns an array of entries.
 * Each entry is defined by a key derived from the object's className and name, and it's associated attributions.
 * Listens to state changes of maps, layers and oblique collections and synchronizes the entries array correspondingly.
 * Returns a destroy function to clear listeners.
 * @param {import("../vcsUiApp.js").default} app
 * @returns {{entries: import("vue").UnwrapRef<Array<AttributionEntry>>, destroy: function():void}}
 */
export function getAttributions(app) {
  /**
   * @type {import("vue").UnwrapRef<Array<AttributionEntry>>}
   */
  const entries = reactive([]);
  /**
   * @type {function():void}
   */
  let obliqueListener = () => {};

  /**
   * Adds an entry for an object using a combination of the object's className and name as key.
   * @param {import("@vcmap/core").VcsMap|import("@vcmap/core").Layer|import("@vcmap/core").ObliqueCollection} object
   */
  function addAttributions(object) {
    const { attributions } = object.properties;
    if (!attributions) {
      return;
    }
    const key = `${object.className}_${object.name}`;
    const idx = entries.findIndex((e) => e.key === key);
    if (idx < 0) {
      entries.push({
        key,
        title:
          object.properties?.title ?? `${object.className}: ${object.name}`,
        attributions: Array.isArray(attributions)
          ? attributions
          : [attributions],
      });
    }
  }

  /**
   * @param {import("@vcmap/core").VcsMap|import("@vcmap/core").Layer|import("@vcmap/core").ObliqueCollection} object
   */
  function removeAttributions(object) {
    const idx = entries.findIndex(
      (e) => e.key === `${object.className}_${object.name}`,
    );
    if (idx >= 0) {
      entries.splice(idx, 1);
    }
  }

  /**
   * adds or removes a AttributionEntry on layer state changes
   * @param {import("@vcmap/core").VcsMap|import("@vcmap/core").Layer|import("@vcmap/core").ObliqueCollection} object
   */
  function syncAttributions(object) {
    if (object?.properties?.attributions === undefined) {
      return;
    }
    if (object.active || object.loaded) {
      addAttributions(object);
    } else {
      removeAttributions(object);
    }
  }

  /**
   *
   * @param {import("@vcmap/core").VcsMap} map
   */
  function initAttributions(map) {
    if (!map) {
      return;
    }
    obliqueListener();
    entries.splice(0);
    syncAttributions(map);
    [...map.layerCollection].forEach((layer) => {
      if (layer.isSupported(map)) {
        syncAttributions(layer);
      }
    });
    if (map instanceof ObliqueMap) {
      syncAttributions(map.collection);
      obliqueListener =
        map.collectionChanged.addEventListener(syncAttributions);
    }
  }

  const listeners = [
    app.maps.mapActivated.addEventListener(initAttributions),
    app.layers.stateChanged.addEventListener(syncAttributions),
    app.layers.removed.addEventListener(removeAttributions),
    app.maps.removed.addEventListener(removeAttributions),
  ];

  initAttributions(app.maps.activeMap);

  const destroy = () => {
    listeners.forEach((cb) => cb());
    obliqueListener();
  };

  return { entries, destroy };
}
