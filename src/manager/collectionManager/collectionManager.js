import { VcsEvent, Collection } from '@vcmap/core';
import { reactive } from 'vue';
import { check, maybe, oneOf } from '@vcsuite/check';
import { validateActions } from '../../components/lists/VcsActionList.vue';
import CollectionComponentClass from './collectionComponentClass.js';

/**
 * @typedef {function(T, import("./collectionComponentClass.js").default<T>, import("./collectionComponentClass.js").CollectionComponentListItem): void} MappingFunction
 * @template {Object} T
 */

/**
 * @typedef {function(T, import("./collectionComponentClass.js").default<T>): boolean} PredicateFunction
 * @template {Object} T
 */

/**
 * @typedef {{
 *   predicate?: PredicateFunction<T>,
 *   mappingFunction: MappingFunction<T>,
 *   owner: string | symbol,
 * }} ItemMapping
 * @template {Object} T
 */

/**
 * @typedef {{
 *   filterFunction: PredicateFunction<T>,
 *   owner: string | symbol
 * }} ItemFilter
 * @template {Object} T
 */

/**
 * @typedef {Object} OwnedAction
 * @property {import("../../actions/actionHelper.js").VcsAction} action
 * @property {number} [weight=0] Optional weight affecting the displaying order
 * @property {string | symbol} owner
 */

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<CollectionComponentClass, import("./collectionComponentClass.js").CollectionComponentClassOptions<Object>>} ICollectionManager
 */

/**
 * Manages a list of collections as collectionComponents.
 * Sets the correct mapping/filter functions and actions on the collectionComponent
 * Provides an API to add/remove collectionsComponents.
 * @implements {ICollectionManager}
 */
class CollectionManager {
  constructor() {
    /**
     * @type {VcsEvent<CollectionComponentClass<Object>>}
     */
    this.added = new VcsEvent();
    /**
     * @type {VcsEvent<CollectionComponentClass<Object>>}
     */
    this.removed = new VcsEvent();
    /**
     * reactive ordered array of ids,
     * @type {import("vue").UnwrapRef<string[]>}
     */
    this.componentIds = reactive([]);
    /**
     * @type {Map<string, CollectionComponentClass<Object>>}
     * @private
     */
    this._collectionComponents = new Map();

    /**
     * @type {Array<ItemMapping & { collectionComponentIds:Array<string> }>}
     * @private
     */
    this._itemMappings = [];
    /**
     * @type {Array<ItemFilter & { collectionComponentIds:Array<string> }>}
     * @private
     */
    this._itemFilters = [];
    /**
     * @type {Array<{ownedActions:Array<OwnedAction>,actions:Array<import("../../actions/actionHelper.js").VcsAction>,owner:string|symbol,collectionComponentIds:Array<string>}>}
     * @private
     */
    this._itemActions = [];
  }

  /**
   * @param {string} id
   * @returns {CollectionComponentClass<Object>|undefined}
   */
  get(id) {
    return this._collectionComponents.get(id);
  }

  /**
   * @param {string} id
   * @returns {boolean}
   */
  has(id) {
    return this._collectionComponents.has(id);
  }

  /**
   * @param {import("@vcmap/core").Collection<Object>} collection
   * @returns {boolean}
   */
  hasCollection(collection) {
    return [...this._collectionComponents.values()].some(
      (c) => c.collection === collection,
    );
  }

  /**
   * gets all collection components corresponding to provided collection
   * @param {import("@vcmap/core").Collection<T>} collection
   * @returns {CollectionComponentClass<T>[]}
   * @template {Object|import("@vcmap/core").VcsObject} T
   */
  getCollection(collection) {
    return [...this._collectionComponents.values()].filter(
      (c) => c.collection === collection,
    );
  }

  /**
   * adds a collectionComponent
   * @param {import("./collectionComponentClass.js").CollectionComponentClassOptions<T>} collectionComponentOptions
   * @param {string|symbol} owner
   * @returns {CollectionComponentClass<T>}
   * @template {Object|import("@vcmap/core").VcsObject} T
   */
  add(collectionComponentOptions, owner) {
    check(collectionComponentOptions, { collection: Collection });
    check(owner, oneOf(String, Symbol));

    if (
      collectionComponentOptions.id &&
      this.has(collectionComponentOptions.id)
    ) {
      throw new Error(
        `A collection component with id ${collectionComponentOptions.id} has already been registered.`,
      );
    }

    const collectionComponent = new CollectionComponentClass(
      collectionComponentOptions,
      owner,
    );
    this._collectionComponents.set(collectionComponent.id, collectionComponent);
    this.componentIds.push(collectionComponent.id);

    const filterIds = ({ collectionComponentIds }) =>
      collectionComponentIds.includes(collectionComponent.id) ||
      collectionComponentIds.length === 0;

    this._itemMappings
      .filter(filterIds)
      .forEach(({ collectionComponentIds, ...itemMapping }) =>
        collectionComponent.addItemMapping(itemMapping),
      );
    this._itemFilters
      .filter(filterIds)
      .forEach(({ collectionComponentIds, ...itemFilter }) =>
        collectionComponent.addItemFilter(itemFilter),
      );
    this._itemActions
      .filter(filterIds)
      .forEach(({ ownedActions }) =>
        collectionComponent.addActions(ownedActions),
      );

    this.added.raiseEvent(collectionComponent);
    return collectionComponent;
  }

  /**
   * removes a CollectionComponentClass, Component will not be rendered anymore and will be destroyed. Add CollectionComponentClass again
   * to show the component again
   * @param {string} id
   */
  remove(id) {
    check(id, String);
    const collectionComponent = this._collectionComponents.get(id);
    if (collectionComponent) {
      const index = this.componentIds.indexOf(id);
      this.componentIds.splice(index, 1);
      this._collectionComponents.delete(id);
      this.removed.raiseEvent(collectionComponent);
      collectionComponent.destroy();
    }
  }

  /**
   * Gets affected ids for adding mapping and filter functions or actions.
   * If no ids are provided, ids of all managed collectionComponents are returned.
   * @param {Array<string>} [collectionComponentIds]
   * @returns {string[]}
   * @private
   */
  _getAffectedIds(collectionComponentIds) {
    return collectionComponentIds.length > 0
      ? collectionComponentIds
      : [...this._collectionComponents.keys()];
  }

  /**
   * adds MappingFunction to the collectionManager. For the given collectionComponents each Item will be transformed by the
   * mappingFunction if the predicate returns true.
   * @param {PredicateFunction<T>} predicate
   * @param {MappingFunction<T>} mappingFunction
   * @param {string | symbol} owner
   * @param {Array<string>} [collectionComponentIds] list of collectionComponents this mappingFunction should be used on. If empty, mappingFunction is applied to all managed collectionComponents.
   * @template {Object} T
   */
  addMappingFunction(
    predicate,
    mappingFunction,
    owner,
    collectionComponentIds = [],
  ) {
    check(predicate, maybe(Function));
    check(mappingFunction, Function);
    check(owner, oneOf(String, Symbol));
    check(collectionComponentIds, [String]);

    /** @type {ItemMapping} */
    const itemMapping = {
      predicate,
      mappingFunction,
      owner,
    };

    if (
      !this._itemMappings.find((cached) => {
        return (
          cached.mappingFunction === mappingFunction && cached.owner === owner
        );
      })
    ) {
      this._getAffectedIds(collectionComponentIds).forEach((id) => {
        const component = this._collectionComponents.get(id);
        if (component) {
          component.addItemMapping(itemMapping);
        }
      });
      this._itemMappings.push({
        ...itemMapping,
        collectionComponentIds,
      });
    }
  }

  /**
   * removes the given mappingFunction
   * @param {MappingFunction<T>} mappingFunction
   * @param {string | symbol} owner
   * @template {Object} T
   */
  removeMappingFunction(mappingFunction, owner) {
    check(mappingFunction, Function);
    check(owner, oneOf(String, Symbol));

    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      collectionComponent.removeItemMapping({ mappingFunction, owner });
    });
    this._itemMappings = this._itemMappings.filter(
      (cached) =>
        !(cached.mappingFunction === mappingFunction && cached.owner === owner),
    );
  }

  /**
   * @param {PredicateFunction<T>} filterFunction
   * @param {string | symbol} owner
   * @param {Array<string>} [collectionComponentIds] list of collectionComponents this filterFunction should be used on. If empty, filterFunction is applied to all managed collectionComponents.
   * @template {Object} T
   */
  addFilterFunction(filterFunction, owner, collectionComponentIds = []) {
    check(filterFunction, Function);
    check(owner, oneOf(String, Symbol));
    check(collectionComponentIds, [String]);

    /** @type {ItemFilter} */
    const itemFilter = {
      filterFunction,
      owner,
    };

    if (
      !this._itemFilters.find((cached) => {
        return (
          cached.filterFunction === filterFunction && cached.owner === owner
        );
      })
    ) {
      this._getAffectedIds(collectionComponentIds).forEach((id) => {
        const component = this._collectionComponents.get(id);
        if (component) {
          component.addItemFilter(itemFilter);
        }
      });
      this._itemFilters.push({
        ...itemFilter,
        collectionComponentIds,
      });
    }
  }

  /**
   * removes the given filterFunction
   * @param {PredicateFunction<T>} filterFunction
   * @param {string | symbol} owner
   * @template {Object} T
   */
  removeFilterFunction(filterFunction, owner) {
    check(filterFunction, Function);
    check(owner, oneOf(String, Symbol));

    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      collectionComponent.removeItemFilter({ filterFunction, owner });
    });
    this._itemFilters = this._itemFilters.filter(
      (cached) =>
        !(cached.filterFunction === filterFunction && cached.owner === owner),
    );
  }

  /**
   * add multiple actions owned by the same owner
   * @param {Array<import("../../actions/actionHelper.js").VcsAction>} actions
   * @param {string | symbol} owner
   * @param {Array<string>} [collectionComponentIds] list of collectionComponents this mappingFunction should be used on. If empty, actions are applied to all managed collectionComponents.
   */
  addActions(actions, owner, collectionComponentIds = []) {
    check(owner, oneOf(String, Symbol));
    check(collectionComponentIds, [String]);

    if (!validateActions(actions)) {
      throw new Error('Invalid actions Array');
    }

    if (
      !this._itemActions.find(
        (cached) => cached.actions === actions && cached.owner === owner,
      )
    ) {
      const ownedActions = actions.map((action) => ({ action, owner }));
      this._getAffectedIds(collectionComponentIds).forEach((id) => {
        const component = this._collectionComponents.get(id);
        if (component) {
          component.addActions(ownedActions);
        }
      });
      this._itemActions.push({
        actions,
        ownedActions,
        owner,
        collectionComponentIds,
      });
    }
  }

  /**
   * @param {Array<import("../../actions/actionHelper.js").VcsAction>} actions
   * @param {string | symbol} owner
   */
  removeActions(actions, owner) {
    check(owner, oneOf(String, Symbol));

    const idx = this._itemActions.findIndex((a) => a.actions === actions);
    if (idx > -1) {
      const { collectionComponentIds, ownedActions } = this._itemActions[idx];
      collectionComponentIds
        .map((id) => this.get(id))
        .forEach((collectionComponent) => {
          collectionComponent.removeActions(ownedActions);
        });
      this._itemActions.splice(idx, 1);
    }
  }

  /**
   * removes managed collection components or actions and mapping/ filter functions belonging to the given owner.
   * @param {string | symbol} owner
   */
  removeOwner(owner) {
    check(owner, oneOf(String, Symbol));

    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      if (collectionComponent.owner === owner) {
        this.remove(collectionComponent.id);
        collectionComponent.destroy();
      } else {
        collectionComponent.removeOwner(owner);
      }
    });

    this._itemMappings = this._itemMappings.filter((itemMapping) => {
      return itemMapping.owner !== owner;
    });
    this._itemFilters = this._itemFilters.filter((itemFilter) => {
      return itemFilter.owner !== owner;
    });
    this._itemActions = this._itemActions.filter(
      (itemAction) => itemAction.owner !== owner,
    );
  }

  /**
   * Resets all collectionComponents
   */
  reset() {
    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      collectionComponent.reset();
    });
  }

  /**
   * Clears the manager of all added categories and item mappings
   */
  clear() {
    [...this.componentIds].forEach((id) => {
      this.remove(id);
    });
    this._itemMappings = [];
    this._itemFilters = [];
    this._itemActions = [];
  }

  /**
   * destroys the categoryManager, removes all Listeners and clears all Managed Categories
   */
  destroy() {
    this.clear();
    this.added.destroy();
    this.removed.destroy();
  }
}

export default CollectionManager;
