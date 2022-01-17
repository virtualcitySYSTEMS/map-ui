// eslint-disable-next-line max-classes-per-file
import { Collection, LayerCollection, MapCollection, VcsEvent } from '@vcmap/core';
import { getLogger as getLoggerByName } from '@vcsuite/logger';
import { contextIdSymbol } from './vcsAppContextHelpers.js';

/**
 * @returns {Logger}
 */
function getLogger() {
  return getLoggerByName('OverrideCollection');
}

/**
 * @name OverrideCollectionInterface
 * @interface
 * @template {*} T
 * @property {import("@vcmap/core").VcsEvent<T>} replaced
 * @property {function(item: T): number} override
 * @property {Map<string, Array<Object>>} shadowMap
 * @property {function(items: Array<Object>, contextId: string):Promise<void>} parseItems
 * @property {function(contextId: string):Promise<void>} removeContext
 */

// This is only used for intelisense
/**
 * @extends {import("@vcmap/core").Collection<T>}
 * @template {*} T
 * @implements {OverrideCollectionInterface}
 */
// eslint-disable-next-line no-unused-vars
class OverrideCollection extends Collection {}

/**
 * @extends {import("@vcmap/core").LayerCollection<T>}
 * @template {*} T
 * @implements {OverrideCollectionInterface}
 */
// eslint-disable-next-line no-unused-vars
class OverrideLayerCollection extends LayerCollection {}

/**
 * @extends {import("@vcmap/core").LayerCollection<T>}
 * @template {*} T
 * @implements {OverrideCollectionInterface}
 */
// eslint-disable-next-line no-unused-vars
class OverrideMapCollection extends MapCollection {}

const isOverrideCollection = Symbol('OverrideCollection');

/**
 * @param {import("@vcmap/core").Collection<T>} collection
 * @param {function():string} getDynamicContextId - function to get the current dynamic context id
 * @param {(function(item: T):Object)=} serializeItem - optional function to serialize an item, defaults to returning item.toJSON or item: i => (i.toJSON || i)
 * @param {(function(obj: Object):(T|Promise<T>))=} deserializeItem - optional desirialization function. defaults to returning the passed object: i => i
 * @param {*=} ctor - optional constructor to validate deserialized items against. if passed, deserializeItem must be an instance of ctor.
 * @param {(function(current: T, previous?: T, currentIndex?: number):(number|null))=} determineShadowIndex - return the index where a shadow should be inserted. only has relevance, if the collection is indexed. previous and current index may be null.
 * @template {*} T
 * @returns {OverrideCollection<T>}
 */
export default function makeOverrideCollection(
  collection,
  getDynamicContextId,
  serializeItem,
  deserializeItem,
  ctor,
  determineShadowIndex,
) {
  if (collection[isOverrideCollection]) {
    throw new Error('Cannot transform colleciton, collection already is an OverrideCollection');
  }
  collection[isOverrideCollection] = true;

  const deserialize = deserializeItem || (i => i);
  const serialize = serializeItem || (i => (i.toJSON ? i.toJSON() : i));
  const getShadowIndex = determineShadowIndex || ((item, shadow, currentIndex) => currentIndex);

  /**
   * @type {Map<string, Array<Object>>} shadowMap
   */
  collection.shadowMap = new Map();

  /**
   * @param {T} item
   * @returns {T|null}
   */
  collection.override = function override(item) {
    let shadow;
    let index;
    const itemId = item[collection.uniqueKey];

    if (collection.hasKey(itemId)) {
      shadow = collection.getByKey(itemId);
      // eslint-disable-next-line no-underscore-dangle
      index = collection._array.indexOf(shadow); // faking remove to not call removed
      if (index > -1) {
        // eslint-disable-next-line no-underscore-dangle
        collection._array.splice(index, 1);
      }
      if (!collection.shadowMap.has(itemId)) {
        collection.shadowMap.set(itemId, []);
      }
      const shadowsArray = collection.shadowMap.get(itemId);
      const serializedShadow = serialize(shadow);
      if (shadow.destroy) {
        shadow.destroy();
      }
      serializedShadow[contextIdSymbol] = shadow[contextIdSymbol];
      shadowsArray.push(serializedShadow);
    }

    const usedIndex = shadow ? getShadowIndex(shadow, item, index) : null;
    if (collection.add(item, usedIndex) >= 0) {
      if (shadow) {
        collection.replaced.raiseEvent(item);
      }
      return item;
    }
    return null;
  };

  /**
   * @param {Array<Object>} configArray
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  collection.parseItems = async function parseItems(configArray, contextId) {
    if (Array.isArray(configArray)) {
      const instanceArray = await Promise.all(configArray.map(async (config) => {
        const item = await deserialize(config);
        if (!item || (ctor && !(item instanceof ctor))) {
          getLogger().warning(`Could not load item ${config[collection.uniqueKey]} of type ${config.type}`);
          return null;
        }
        item[contextIdSymbol] = contextId;
        return item;
      }));
      instanceArray
        .filter(i => i)
        .forEach((i) => { collection.override(i); });
    }
  };

  collection.removed.addEventListener(async (item) => {
    const itemId = item[collection.uniqueKey];

    if (collection.shadowMap.has(itemId)) {
      const serializedShadow = collection.shadowMap.get(itemId).pop();
      if (serializedShadow) {
        const reincarnation = deserialize(serializedShadow);
        reincarnation[contextIdSymbol] = serializedShadow[contextIdSymbol];
        const index = getShadowIndex(reincarnation, item, item[collection.previousIndexSymbol]);
        collection.add(reincarnation, index);
      }

      if (collection.shadowMap.get(itemId).length === 0) {
        collection.shadowMap.delete(itemId);
      }
    }
  });

  collection.added.addEventListener((item) => {
    if (!item[contextIdSymbol]) {
      item[contextIdSymbol] = getDynamicContextId();
    }
  });

  /**
   * @param {string} contextId
   * @returns {Promise<void>}
   */
  collection.removeContext = async function removeContext(contextId) {
    collection.shadowMap.forEach((shadowsArray, name) => {
      const newShadowsArray = shadowsArray.filter(c => c[contextIdSymbol] !== contextId);
      if (newShadowsArray.length === 0) {
        collection.shadowMap.delete(name);
      } else if (newShadowsArray.length !== shadowsArray.length) {
        collection.shadowMap.set(name, newShadowsArray);
      }
    });

    await Promise.all([...collection]
      .filter(item => item[contextIdSymbol] === contextId)
      .map(async (item) => {
        collection.remove(item);
        if (item.destroy) {
          item.destroy();
        }
      }));
  };

  /**
   * @type {VcsEvent<T>}
   */
  collection.replaced = new VcsEvent();

  const originalDestroy = collection.destroy.bind(collection);

  collection.destroy = function destroy() {
    originalDestroy();
    collection.shadowMap.clear();
    collection.replaced.destroy();
  };

  return collection;
}
