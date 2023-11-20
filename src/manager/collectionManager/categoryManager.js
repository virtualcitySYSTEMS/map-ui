import { moduleIdSymbol } from '@vcmap/core';
import { vcsAppSymbol } from '../../pluginHelper.js';
import CollectionManager from './collectionManager.js';

/**
 * Manages all requested category collections.
 * Provides an API to add/remove collectionsComponents.
 * @implements {VcsComponentManager<CollectionComponent, CollectionComponentOptions>}
 * @extends CollectionManager
 */
class CategoryManager extends CollectionManager {
  /**
   * @param {import("../../vcsUiApp.js").VcsUiApp} app
   */
  /**
   * @param {import("../../vcsUiApp.js").VcsUiApp} app
   */
  constructor(app) {
    super();

    /**
     * @type {import("../../vcsUiApp.js").VcsUiApp}
     * @private
     */
    this._app = app;
    /**
     * @type {string}
     * @private
     */
    this._dynamicModuleId = this._app.dynamicModuleId;

    this._dynamicModuleIdFilter = (item) =>
      item[moduleIdSymbol] === this._dynamicModuleId;

    this.addFilterFunction(this._dynamicModuleIdFilter, vcsAppSymbol);

    this._categoryListeners = [
      this._app.dynamicModuleIdChanged.addEventListener((id) => {
        this._dynamicModuleId = id;
        this.reset();
      }),
      this._app.categories.removed.addEventListener((category) => {
        const collectionComponents = this.getCollection(category.collection);
        collectionComponents.forEach(({ id }) => this.remove(id));
      }),
    ];
  }

  /**
   * Requests a new or existing category and adds its collection to this manager.
   * The collectionComponent's id is always the category's name.
   * Returns requested category and its corresponding collectionComponent.
   * @param {import("@vcmap/core").CategoryOptions} options
   * @param {string|symbol} owner
   * @param {CollectionComponentUiOptions} collectionComponentOptions
   * @returns {{ collectionComponent:CollectionComponent,category:import("@vcmap/core").Category }}
   */
  async requestCategory(options, owner, collectionComponentOptions = {}) {
    const category = await this._app.categories.requestCategory(options);
    const id = category.name;
    if (this.has(id)) {
      const collectionComponent = this.get(id);
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

  destroy() {
    super.destroy();
    this._categoryListeners.forEach((cb) => cb());
  }
}

export default CategoryManager;
