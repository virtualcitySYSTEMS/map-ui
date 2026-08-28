import type { Reactive } from 'vue';
import { reactive } from 'vue';
import type { Layer, ObliqueCollection, VcsMap } from '@vcmap/core';
import { ObliqueMap } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';

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

/**
 * Gets attributions of all active maps, layers and oblique collections and returns an array of entries.
 * Each entry is defined by a key derived from the object's className and name, and it's associated attributions.
 * Listens to state changes of maps, layers and oblique collections and synchronizes the entries array correspondingly.
 * Returns a destroy function to clear listeners.
 */
export function getAttributions(app: VcsUiApp): {
  entries: Reactive<AttributionEntry[]>;
  destroy: () => void;
} {
  const entries = reactive<AttributionEntry[]>([]);
  let obliqueListener = (): void => {};

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

  function removeAttributions(
    object: VcsMap | Layer | ObliqueCollection,
  ): void {
    const idx = entries.findIndex(
      (e) => e.key === `${object.className}_${object.name}`,
    );
    if (idx >= 0) {
      entries.splice(idx, 1);
    }
  }

  /**
   * adds or removes a AttributionEntry for layers or maps
   */
  function syncAttributions(object: VcsMap | Layer): void {
    if (object?.properties?.attributions === undefined) {
      return;
    }
    if (object.active) {
      addAttributions(object);
    } else {
      removeAttributions(object);
    }
  }

  function initAttributions(map: VcsMap): void {
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
    if (map instanceof ObliqueMap && map.collection) {
      addAttributions(map.collection);
      obliqueListener = map.collectionChanged.addEventListener(
        (obliqueCollection) => {
          [...app.obliqueCollections].forEach(removeAttributions);
          addAttributions(obliqueCollection);
        },
      );
    }
  }

  const listeners = [
    app.maps.mapActivated.addEventListener(initAttributions),
    app.layers.stateChanged.addEventListener(syncAttributions),
    app.layers.removed.addEventListener(removeAttributions),
    app.maps.removed.addEventListener(removeAttributions),
  ];

  // Setup may run before a map is activated; mapActivated initializes entries later.
  if (app.maps.activeMap) {
    initAttributions(app.maps.activeMap);
  }

  const destroy = (): void => {
    listeners.forEach((cb) => {
      cb();
    });
    obliqueListener();
  };

  return { entries, destroy };
}
