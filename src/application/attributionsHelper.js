import { reactive, watch } from 'vue';
import { ObliqueMap } from '@vcmap/core';

/**
 * @typedef {Object} AttributionOptions
 * @property {string} provider - name of the data provider
 * @property {number} [year] - year of dataset
 * @property {string} url - link to data provider
 * @property {string} [icon] - provider logo
 */

/**
 * @typedef {Object} AttributionEntry
 * @property {string} key - name of the VcsObject the attribution applies to
 * @property {string} title - title of the VcsObject the attribution applies to
 * @property {AttributionOptions|Array<AttributionOptions>} attributions - attributions of a map, layer or oblique collection
 */

/**
 * @typedef {Object} Attributions
 * @property {import("vue").UnwrapRef<Array<AttributionEntry>>} entries - reactive array of attribution entries
 * @property {function(import("@vcmap/core").VcsMap, string|import('../pluginHelper.js').vcsAppSymbol): function():void} registerMap - function to register a map and its layer collection for an owner, returns a function to unregister it
 * @property {function(string|import('../pluginHelper.js').vcsAppSymbol):void} removeOwner - unregister all maps registered by an owner
 * @property {function():void} destroy - function to clear all listeners and clean up attributions
 */

/**
 * merges attribution entries of same providers
 * @param {Array<AttributionEntry>} entries
 * @returns {Array<{provider: string, years: string, url: string, icon?:string}>}
 */
export function mergeAttributions(entries) {
  const providers = {};
  entries.forEach(({ attributions }) => {
    attributions.forEach(({ provider, year, url, icon }) => {
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
            if (icon && !providerObject.icon) {
              providerObject.icon = icon;
            }
          }
        }
      } else {
        providers[provider] = {
          years: year ? [Number(year)] : [],
          url,
          ...(icon && { icon }),
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
 * @returns {Attributions}
 */
export function getAttributions(app) {
  /**
   * @type {import("vue").UnwrapRef<Array<AttributionEntry>>}
   */
  const entries = reactive([]);
  /** @type {Map<import("@vcmap/core").VcsMap, { collection: import("@vcmap/core").LayerCollection, registrations: Map<function():void, string|import('../pluginHelper.js').vcsAppSymbol>, removeListeners: Array<function():void> }>} */
  const registeredMaps = new Map();
  /** @type {Map<import("@vcmap/core").ObliqueMap, function():void>} */
  const obliqueListeners = new Map();

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

  function updateAttributions() {
    entries.splice(0);
    /** @type {Map<import("@vcmap/core").VcsMap, import("@vcmap/core").LayerCollection>} */
    const visibleMaps = new Map();
    if (app.maps.activeMap) {
      visibleMaps.set(app.maps.activeMap, app.maps.activeMap.layerCollection);
    }
    if (app.overviewMap.active) {
      const overviewMap = app.overviewMap.map;
      visibleMaps.set(overviewMap, overviewMap.layerCollection);
    }
    registeredMaps.forEach(({ collection }, map) => {
      if (map.active) {
        visibleMaps.set(map, collection);
      }
    });
    obliqueListeners.forEach((removeListener, map) => {
      if (!visibleMaps.has(map)) {
        removeListener();
        obliqueListeners.delete(map);
      }
    });
    visibleMaps.forEach((collection, map) => {
      if (map.active) {
        addAttributions(map);
      }
      [...collection].forEach((layer) => {
        if (layer.active && layer.isSupported(map)) {
          addAttributions(layer);
        }
      });
      if (map instanceof ObliqueMap) {
        if (map.collection) {
          addAttributions(map.collection);
        }
        if (!obliqueListeners.has(map)) {
          obliqueListeners.set(
            map,
            map.collectionChanged.addEventListener(updateAttributions),
          );
        }
      }
    });
  }

  const listeners = [
    app.maps.mapActivated.addEventListener(updateAttributions),
    app.layers.stateChanged.addEventListener(updateAttributions),
    app.layers.added.addEventListener(updateAttributions),
    app.layers.removed.addEventListener(updateAttributions),
    app.maps.removed.addEventListener(updateAttributions),
    watch(app.overviewMap.currentState, updateAttributions),
  ];

  updateAttributions();

  /**
   * @param {import("@vcmap/core").VcsMap} map
   * @param {string|import('../pluginHelper.js').vcsAppSymbol} owner
   * @returns {function():void}
   */
  function registerMap(map, owner) {
    if (!registeredMaps.has(map)) {
      registeredMaps.set(map, {
        collection: map.layerCollection,
        registrations: new Map(),
        removeListeners: [
          map.stateChanged.addEventListener(updateAttributions),
          map.layerCollection.added.addEventListener(updateAttributions),
          map.layerCollection.removed.addEventListener(updateAttributions),
        ],
      });
    }
    const unregister = () => {
      const current = registeredMaps.get(map);
      if (!current?.registrations.delete(unregister)) {
        return;
      }
      if (current.registrations.size === 0) {
        current.removeListeners.forEach((removeListener) => {
          removeListener();
        });
        registeredMaps.delete(map);
      }
      updateAttributions();
    };
    registeredMaps.get(map).registrations.set(unregister, owner);
    updateAttributions();
    return unregister;
  }

  /**
   * @param {string|import('../pluginHelper.js').vcsAppSymbol} owner
   */
  function removeOwner(owner) {
    registeredMaps.forEach(({ registrations }) => {
      registrations.forEach((registrationOwner, unregister) => {
        if (registrationOwner === owner) {
          unregister();
        }
      });
    });
  }

  const destroy = () => {
    listeners.forEach((cb) => cb());
    obliqueListeners.forEach((removeListener) => {
      removeListener();
    });
    obliqueListeners.clear();
    registeredMaps.forEach(({ removeListeners }) => {
      removeListeners.forEach((removeListener) => {
        removeListener();
      });
    });
    registeredMaps.clear();
  };

  return { entries, registerMap, removeOwner, destroy };
}
