import { moduleIdSymbol } from '@vcmap/core';
import { vcsAppSymbol } from '../../pluginHelper.js';
import CollectionManager from './collectionManager.js';

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<import("./collectionComponentClass.js").default<Object>, import("./collectionComponentClass.js").CollectionComponentClassOptions<Object>>} ICategoryManager
 */

/**
 * Manages all requested category collections.
 * Provides an API to add/remove collectionsComponents.
 * @implements {ICategoryManager}
 * @extends CollectionManager
 */
class CategoryManager extends CollectionManager {
  /**
   * @param {import("../../vcsUiApp.js").default} app
   */
  /**
   * @param {import("../../vcsUiApp.js").default} app
   */
  constructor(app) {
    super();

    /**
     * @type {import("../../vcsUiApp.js").default}
     * @private
     */
    this._app = app;
    /**
     * @type {string}
     * @private
     */
    this._dynamicModuleId = this._app.dynamicModuleId;

    /**
     * @param {Object} item
     * @return {boolean}
     * @private
     */
    this._dynamicModuleIdFilter = (item) =>
      item[moduleIdSymbol] === this._dynamicModuleId;

    this.addFilterFunction(this._dynamicModuleIdFilter, vcsAppSymbol);

    /**
     * @type {(() => void)[]}
     * @private
     */
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
   * @param {import("@vcmap/core").CategoryOptions<T>} options
   * @param {string|symbol} owner
   * @param {import("./collectionComponentClass.js").CollectionComponentUiOptions} collectionComponentOptions
   * @returns {Promise<{ collectionComponent: import("./collectionComponentClass.js").default<T>, category: import("@vcmap/core").Category<T> }>}
   * @template {Object|import("@vcmap/core").VcsObject} T
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
