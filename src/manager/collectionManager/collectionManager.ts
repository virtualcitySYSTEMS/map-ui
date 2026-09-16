import { Collection, VcsEvent, type VcsObject } from '@vcmap/core';
import { reactive } from 'vue';
import { check, maybe, oneOf } from '@vcsuite/check';
import { validateActions } from '../../components/lists/VcsActionList.ts.vue';
import CollectionComponentClass, {
  type CollectionComponentClassOptions,
  type CollectionComponentListItem,
} from './collectionComponentClass.js';
import type { VcsAction } from '../../actions/actionHelper.js';
import type { VcsComponentManager } from '../../vcsUiApp.js';
import type { vcsAppSymbol } from '../../pluginHelper.js';

export type MappingFunction<T extends object | VcsObject = object> = (
  item: T,
  collectionComponent: CollectionComponentClass<T>,
  listItem: CollectionComponentListItem,
) => void;

export type PredicateFunction<T extends object | VcsObject = object> = (
  item: T,
  collectionComponent: CollectionComponentClass<T>,
) => boolean;

export type ItemMapping<T extends object | VcsObject = object> = {
  predicate?: PredicateFunction<T>;
  mappingFunction: MappingFunction<T>;
  owner: string | symbol;
};

export type ItemFilter<T extends object | VcsObject = object> = {
  filterFunction: PredicateFunction<T>;
  owner: string | symbol;
};

export type OwnedAction = {
  action: VcsAction;
  weight?: number;
  owner: string | symbol;
};

type ICollectionManager = VcsComponentManager<
  CollectionComponentClass,
  CollectionComponentClassOptions<object>
>;

/**
 * Manages a list of collections as collectionComponents.
 * Sets the correct mapping/filter functions and actions on the collectionComponent
 * Provides an API to add/remove collectionsComponents.
 */
class CollectionManager implements ICollectionManager {
  added = new VcsEvent<CollectionComponentClass>();
  removed = new VcsEvent<CollectionComponentClass>();
  componentIds = reactive<string[]>([]);
  private _collectionComponents = new Map<string, CollectionComponentClass>();
  private _itemMappings: Array<
    ItemMapping & { collectionComponentIds: string[] }
  > = [];
  private _itemFilters: Array<
    ItemFilter & { collectionComponentIds: string[] }
  > = [];
  private _itemActions: Array<{
    ownedActions: OwnedAction[];
    actions: VcsAction[];
    owner: string | symbol;
    collectionComponentIds: string[];
  }> = [];

  get(id: string): CollectionComponentClass | undefined {
    return this._collectionComponents.get(id);
  }

  has(id: string): boolean {
    return this._collectionComponents.has(id);
  }

  hasCollection(collection: Collection<object>): boolean {
    return [...this._collectionComponents.values()].some(
      (c) => c.collection === collection,
    );
  }

  /**
   * gets all collection components corresponding to provided collection
   */
  getCollection(collection: Collection<object>): CollectionComponentClass[] {
    return [...this._collectionComponents.values()].filter(
      (c) => c.collection === collection,
    );
  }

  add<T extends object | VcsObject>(
    collectionComponentOptions: CollectionComponentClassOptions<T>,
    owner: string | typeof vcsAppSymbol,
  ): CollectionComponentClass<T> {
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

    const filterIds = ({
      collectionComponentIds,
    }: {
      collectionComponentIds: string[];
    }): boolean =>
      collectionComponentIds.includes(collectionComponent.id) ||
      collectionComponentIds.length === 0;

    this._itemMappings
      .filter(filterIds)
      .forEach(({ collectionComponentIds, ...itemMapping }) => {
        collectionComponent.addItemMapping(itemMapping);
      });
    this._itemFilters
      .filter(filterIds)
      .forEach(({ collectionComponentIds, ...itemFilter }) => {
        collectionComponent.addItemFilter(itemFilter);
      });
    this._itemActions.filter(filterIds).forEach(({ ownedActions }) => {
      collectionComponent.addActions(ownedActions);
    });

    this.added.raiseEvent(collectionComponent);
    return collectionComponent as unknown as CollectionComponentClass<T>;
  }

  /**
   * removes a CollectionComponentClass, Component will not be rendered anymore and will be destroyed. Add CollectionComponentClass again
   * to show the component again
   */
  remove(id: string): void {
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
   */
  private _getAffectedIds(collectionComponentIds?: string[]): string[] {
    return collectionComponentIds && collectionComponentIds.length > 0
      ? collectionComponentIds
      : [...this._collectionComponents.keys()];
  }

  /**
   * adds MappingFunction to the collectionManager. For the given collectionComponents each Item will be transformed by the
   * mappingFunction if the predicate returns true.
   * @param collectionComponentIds list of collectionComponents this mappingFunction should be used on. If empty, mappingFunction is applied to all managed collectionComponents.
   */
  addMappingFunction(
    predicate: PredicateFunction,
    mappingFunction: MappingFunction,
    owner: string | typeof vcsAppSymbol,
    collectionComponentIds: string[] = [],
  ): void {
    check(predicate, maybe(Function));
    check(mappingFunction, Function);
    check(owner, oneOf(String, Symbol));
    check(collectionComponentIds, [String]);

    const itemMapping: ItemMapping = { predicate, mappingFunction, owner };

    if (
      !this._itemMappings.find(
        (cached) =>
          cached.mappingFunction === mappingFunction && cached.owner === owner,
      )
    ) {
      this._getAffectedIds(collectionComponentIds).forEach((id) => {
        const component = this._collectionComponents.get(id);
        if (component) {
          component.addItemMapping(itemMapping);
        }
      });
      this._itemMappings.push({ ...itemMapping, collectionComponentIds });
    }
  }

  /**
   * removes the given mappingFunction
   */
  removeMappingFunction(
    mappingFunction: MappingFunction,
    owner: string | typeof vcsAppSymbol,
  ): void {
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
   * @param collectionComponentIdslist of collectionComponents this filterFunction should be used on. If empty, filterFunction is applied to all managed collectionComponents.
   */
  addFilterFunction(
    filterFunction: PredicateFunction,
    owner: string | typeof vcsAppSymbol,
    collectionComponentIds: string[] = [],
  ): void {
    check(filterFunction, Function);
    check(owner, oneOf(String, Symbol));
    check(collectionComponentIds, [String]);

    const itemFilter: ItemFilter = { filterFunction, owner };

    if (
      !this._itemFilters.find(
        (cached) =>
          cached.filterFunction === filterFunction && cached.owner === owner,
      )
    ) {
      this._getAffectedIds(collectionComponentIds).forEach((id) => {
        const component = this._collectionComponents.get(id);
        if (component) {
          component.addItemFilter(itemFilter);
        }
      });
      this._itemFilters.push({ ...itemFilter, collectionComponentIds });
    }
  }

  /**
   * removes the given filterFunction
   */
  removeFilterFunction(
    filterFunction: PredicateFunction,
    owner: string | typeof vcsAppSymbol,
  ): void {
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
   * @param collectionComponentIds list of collectionComponents this mappingFunction should be used on. If empty, actions are applied to all managed collectionComponents.
   */
  addActions(
    actions: VcsAction[],
    owner: string | typeof vcsAppSymbol,
    collectionComponentIds: string[] = [],
  ): void {
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

  removeActions(
    actions: VcsAction[],
    owner: string | typeof vcsAppSymbol,
  ): void {
    check(owner, oneOf(String, Symbol));

    const idx = this._itemActions.findIndex((a) => a.actions === actions);
    if (idx > -1) {
      const { collectionComponentIds, ownedActions } = this._itemActions[idx];
      collectionComponentIds
        .map((id) => this.get(id))
        .forEach((collectionComponent) => {
          collectionComponent?.removeActions(ownedActions);
        });
      this._itemActions.splice(idx, 1);
    }
  }

  /**
   * removes managed collection components or actions and mapping/ filter functions belonging to the given owner.
   */
  removeOwner(owner: string | typeof vcsAppSymbol): void {
    check(owner, oneOf(String, Symbol));

    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      if (collectionComponent.owner === owner) {
        this.remove(collectionComponent.id);
        collectionComponent.destroy();
      } else {
        collectionComponent.removeOwner(owner);
      }
    });

    this._itemMappings = this._itemMappings.filter(
      (itemMapping) => itemMapping.owner !== owner,
    );
    this._itemFilters = this._itemFilters.filter(
      (itemFilter) => itemFilter.owner !== owner,
    );
    this._itemActions = this._itemActions.filter(
      (itemAction) => itemAction.owner !== owner,
    );
  }

  /**
   * Resets all collectionComponents
   */
  reset(): void {
    [...this._collectionComponents.values()].forEach((collectionComponent) => {
      collectionComponent.reset();
    });
  }

  /**
   * Clears the manager of all added categories and item mappings
   */
  clear(): void {
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
  destroy(): void {
    this.clear();
    this.added.destroy();
    this.removed.destroy();
  }
}

export default CollectionManager;
