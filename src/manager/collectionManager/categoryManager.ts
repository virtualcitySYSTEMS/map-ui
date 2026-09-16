import {
  type Category,
  type CategoryOptions,
  type VcsObject,
  defaultDynamicModuleId,
  moduleIdSymbol,
} from '@vcmap/core';
import { check } from '@vcsuite/check';
import { vcsAppSymbol } from '../../pluginHelper.js';
import CollectionManager from './collectionManager.js';
import type CollectionComponentClass from './collectionComponentClass.js';
import type {
  CollectionComponentClassOptions,
  CollectionComponentUiOptions,
} from './collectionComponentClass.js';
import type VcsUiApp from '../../vcsUiApp.js';
import type { VcsComponentManager } from '../../vcsUiApp.js';

type ICategoryManager = VcsComponentManager<
  CollectionComponentClass,
  CollectionComponentClassOptions<object>
>;

/**
 * Manages all requested category collections.
 * Provides an API to add/remove collectionsComponents.
 * Per default only items of the defaultDynamicModuleId are shown in the CategoryManager.
 * Further modules can be supported using the addModuleId API.
 */

class CategoryManager extends CollectionManager implements ICategoryManager {
  private _app: VcsUiApp;
  private _dynamicModuleId: string = defaultDynamicModuleId;
  private _moduleIds: string[] = [];
  private _dynamicModuleIdFilter: (
    item: object & { [moduleIdSymbol]?: string },
  ) => boolean = (item) => item[moduleIdSymbol] === this._dynamicModuleId;
  private _categoryListeners: (() => void)[];
  constructor(app: VcsUiApp) {
    super();

    this._app = app;
    this.addFilterFunction(this._dynamicModuleIdFilter, vcsAppSymbol);

    this._categoryListeners = [
      this._app.dynamicModuleIdChanged.addEventListener((id) => {
        if (id === defaultDynamicModuleId || this._moduleIds.includes(id)) {
          this._dynamicModuleId = id;
        }
        this.reset();
      }),
      this._app.categories.removed.addEventListener((category) => {
        this.remove(category.name);
      }),
    ];
  }

  /**
   * Requests a new or existing category and adds its collection to this manager.
   * The collectionComponent's id is always the category's name.
   * Returns requested category and its corresponding collectionComponent.
   */
  requestCategory<T extends object | VcsObject>(
    options: CategoryOptions<T>,
    owner: string | typeof vcsAppSymbol,
    collectionComponentOptions: CollectionComponentUiOptions<T> = {},
  ): {
    collectionComponent: CollectionComponentClass<T>;
    category: Category<T>;
  } {
    const category = this._app.categories.requestCategory<T>(options)!;
    const id = category.name;
    if (this.has(id)) {
      const collectionComponent = this.get(
        id,
      ) as unknown as CollectionComponentClass<T>;
      return { collectionComponent, category };
    }
    const collectionComponent = this.add(
      {
        ...collectionComponentOptions,
        id,
        title: collectionComponentOptions.title ?? category.title ?? id,
        collection: category.collection,
      },
      owner,
    );
    return { collectionComponent, category };
  }

  /**
   * Updates the filterFunction for added moduleIds.
   * Items of added moduleIds, are shown in the CategoryManager
   */
  addModuleId(id: string): void {
    check(id, String);
    if (!this._moduleIds.includes(id)) {
      this._moduleIds.push(id);
    }
    if (id === this._app.dynamicModuleId) {
      this.reset();
    }
  }

  removeModuleId(id: string): void {
    const idx = this._moduleIds.indexOf(id);
    if (idx > -1) {
      this._moduleIds.splice(idx, 1);
    }
    if (id === this._app.dynamicModuleId) {
      this.reset();
    }
  }

  destroy(): void {
    super.destroy();
    this._categoryListeners.forEach((cb) => {
      cb();
    });
  }
}

export default CategoryManager;
