
// eslint-disable-next-line no-unused-vars
import MapCollection from '@vcmap/core/src/vcs/vcm/util/mapCollection';

/**
 * @typedef MapReturnObject
 * @type {Object}
 * @property {Function} destroy call this to destroy the map and unregister the store module
 */

/**
 * @param {Object} obj
 * @param {MapCollection} obj.mapCollection
 * @param {string} obj.moduleName
 * @param {Object} obj.$store
 * @returns {MapReturnObject}
 */
// eslint-disable-next-line import/prefer-default-export
export function registerMapCollection({ mapCollection, moduleName, $store }) {
  /**
   * @typedef Map
   * @property {string} name
   * @property {string} className
   */
  /**
   * @constant {Map[]} maps
   */
  const maps = [...mapCollection].map(({ className, name }) => ({ className, name }));
  /**
   * @typedef MapCollectionState
   * @type {Object}
   * @property {Map[]} maps
   * @property {string} activeMap
   */

  /**
   * @constant initialState
   * @type {MapCollectionState}
   */
  const initialState = {
    maps,
    activeMap: null,
  };

  const storeModule = {
    strict: true,
    namespaced: true,
    state: initialState,
    mutations: {
      /**
       * @param {MapCollectionState} state
       * @param {string} mapName
       */
      setActiveMap(state, mapName) {
        state.activeMap = mapName;
      },
    },
  };

  const mapActivatedDestroy = mapCollection.mapActivated.addEventListener((map) => {
    // 2. Set state
    $store.commit(`${moduleName}/setActiveMap`, map.name);
  });

  $store.registerModule(moduleName, storeModule);

  // Return object containing destroy function
  return {
    destroy: () => {
      mapActivatedDestroy();
      $store.unregisterModule(moduleName);
      mapCollection.destroy();
    },
  };
}
