import { defaultDynamicModuleId, moduleIdSymbol } from '@vcmap/core';
import { check } from '@vcsuite/check';
import { vcsAppSymbol } from '../../pluginHelper.js';
import CollectionManager from './collectionManager.js';

/**
 * @typedef {import("../../vcsUiApp.js").VcsComponentManager<import("./collectionComponentClass.js").default<Object>, import("./collectionComponentClass.js").CollectionComponentClassOptions<Object>>} ICategoryManager
 */

/**
 * Manages all requested category collections.
 * Provides an API to add/remove collectionsComponents.
 * Per default only items of the defaultDynamicModuleId are shown in the CategoryManager.
 * Further modules can be supported using the addModuleId API.
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
    this._dynamicModuleId = defaultDynamicModuleId;
    /**
     * @type {string[]}
     * @private
     */
    this._moduleIds = [];

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
        if (id === defaultDynamicModuleId || this._moduleIds.includes(id)) {
          this._dynamicModuleId = id;
        }
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

  /**
   * Updates the filterFunction for added moduleIds.
   * Items of added moduleIds, are shown in the CategoryManager
   * @param {string} id
   */
  addModuleId(id) {
    check(id, String);
    if (!this._moduleIds.includes(id)) {
      this._moduleIds.push(id);
    }
    if (id === this._app.dynamicModuleId) {
      this.reset();
    }
  }

  /**
   * @param {string} id
   */
  removeModuleId(id) {
    const idx = this._moduleIds.indexOf(id);
    if (idx > -1) {
      this._moduleIds.splice(idx, 1);
    }
    if (id === this._app.dynamicModuleId) {
      this.reset();
    }
  }

  destroy() {
    super.destroy();
    this._categoryListeners.forEach((cb) => cb());
  }
}

export default CategoryManager;
