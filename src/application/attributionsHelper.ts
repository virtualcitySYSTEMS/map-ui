import { type Reactive, reactive, watch } from 'vue';
import {
  type Layer,
  type LayerCollection,
  type ObliqueCollection,
  ObliqueMap,
  type VcsMap,
} from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { vcsAppSymbol } from '../pluginHelper.js';

type AttributionOptions = {
  /** name of the data provider */
  provider: string;
  /** year of dataset */
  year?: number;
  /** link to data provider */
  url: string;
  /** provider logo */
  icon?: string;
};

export type AttributionEntry = {
  /** name of the VcsObject the attribution applies to */
  key: string;
  /** title of the VcsObject the attribution applies to */
  title: string;
  /** attributions of a map, layer or oblique collection */
  attributions: Array<AttributionOptions>;
};

/**
 * merges attribution entries of same providers
 */
export function mergeAttributions(entries: Array<AttributionEntry>): Array<{
  provider: string;
  years: string;
  url: string;
  icon?: string;
}> {
  const providers: Record<
    string,
    { years: number[]; url: string; icon?: string }
  > = {};
  entries.forEach(({ attributions }) => {
    (Array.isArray(attributions) ? attributions : [attributions]).forEach(
      ({ provider, year, url, icon }) => {
        const providerObject = providers[provider];
        if (providerObject) {
          if (year) {
            const index = providerObject.years.indexOf(year);
            if (url && index === -1) {
              if (providerObject.years.every((y) => y < year)) {
                providerObject.url = url;
              }
              if (year) {
                const set = new Set([...providerObject.years, year]);
                providerObject.years = [...set].sort((a, b) => a - b);
              }
              if (icon && !providerObject.icon) {
                providerObject.icon = icon;
              }
            }
          }
        } else {
          providers[provider] = {
            years: year ? [year] : [],
            url,
            ...(icon && { icon }),
          };
        }
      },
    );
  });
  return Object.keys(providers).map((provider) => ({
    provider,
    years: providers[provider].years.join(', '),
    url: providers[provider].url,
  }));
}

export type Attributions = {
  /** reactive array of attribution entries */
  entries: Reactive<AttributionEntry[]>;
  /** registers a map and its layer collection for an owner, returns a function to unregister it */
  registerMap: (map: VcsMap, owner: string | typeof vcsAppSymbol) => () => void;
  /** unregister all maps registered by an owner */
  removeOwner: (owner: string | typeof vcsAppSymbol) => void;
  /** clears all listeners and cleans up attributions */
  destroy: () => void;
};

/**
 * Gets attributions of all active maps, layers and oblique collections and returns an array of entries.
 * Each entry is defined by a key derived from the object's className and name, and it's associated attributions.
 * Listens to state changes of maps, layers and oblique collections and synchronizes the entries array correspondingly.
 * Returns a destroy function to clear listeners.
 */
export function getAttributions(app: VcsUiApp): Attributions {
  const entries = reactive<AttributionEntry[]>([]);
  const registeredMaps = new Map<
    VcsMap,
    {
      collection: LayerCollection;
      registrations: Map<() => void, string | typeof vcsAppSymbol>;
      removeListeners: Array<() => void>;
    }
  >();
  const obliqueListeners = new Map<ObliqueMap, () => void>();

  /**
   * Adds an entry for an object using a combination of the object's className and name as key.
   */
  function addAttributions(object: VcsMap | Layer | ObliqueCollection): void {
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
          (object.properties?.title as string) ??
          `${object.className}: ${object.name}`,
        attributions: Array.isArray(attributions)
          ? attributions
          : [attributions],
      });
    }
  }

  function updateAttributions(): void {
    entries.splice(0);
    const visibleMaps = new Map<VcsMap, LayerCollection>();
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

  function registerMap(
    map: VcsMap,
    owner: string | typeof vcsAppSymbol,
  ): () => void {
    let registered = registeredMaps.get(map);
    if (!registered) {
      registered = {
        collection: map.layerCollection,
        registrations: new Map(),
        removeListeners: [
          map.stateChanged.addEventListener(updateAttributions),
          map.layerCollection.added.addEventListener(updateAttributions),
          map.layerCollection.removed.addEventListener(updateAttributions),
        ],
      };
      registeredMaps.set(map, registered);
    }
    const unregister = (): void => {
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
    registered.registrations.set(unregister, owner);
    updateAttributions();
    return unregister;
  }

  function removeOwner(owner: string | typeof vcsAppSymbol): void {
    registeredMaps.forEach(({ registrations }) => {
      registrations.forEach((registrationOwner, unregister) => {
        if (registrationOwner === owner) {
          unregister();
        }
      });
    });
  }

  const destroy = (): void => {
    listeners.forEach((cb) => {
      cb();
    });
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
