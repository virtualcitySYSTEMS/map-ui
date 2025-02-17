import { ObliqueMap, DefaultObliqueCollection } from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import { setViewpointAction } from './layerContentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { collectionName: string, showWhenNotSupported?: boolean }} ObliqueCollectionContentTreeItemOptions
 * @property {boolean} [showWhenNotSupported=false] - optional flag to show the item even if it is not supported by the activeMap.
 */

/**
 * @typedef {import("./vcsObjectContentTreeItem.js").VcsObjectContentTreeItemProperties & { defaultViewpoint: string }} ObliqueCollectionContentTreeItemProperties
 */

/**
 * @type {DefaultObliqueCollection}
 */
const defaultCollection = new DefaultObliqueCollection({});

/**
 * An oblique collection item. Sets/unsets the oblique collection when clicked.
 * @extends {VcsObjectContentTreeItem<ObliqueCollectionContentTreeItemProperties>}
 */
class ObliqueCollectionContentTreeItem extends VcsObjectContentTreeItem {
  /**
   * @type {string}
   */
  static get className() {
    return 'ObliqueCollectionContentTreeItem';
  }

  /**
   * @param {ObliqueCollectionContentTreeItemOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);
    this.state = StateActionState.INACTIVE;
    /**
     * @type {string}
     * @private
     */
    this._collectionName = options.collectionName;

    /**
     * @type {boolean}
     * @private
     */
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @type {import("@vcmap/core").ObliqueCollection}
   * @private
   */
  get _collection() {
    return this._app.obliqueCollections.getByKey(this._collectionName);
  }

  /**
   * @param {ObliqueCollectionContentTreeItemProperties} properties
   * @protected
   */
  _setProperties(properties) {
    super._setProperties(properties);

    setViewpointAction(this, this._app, properties.defaultViewpoint);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();

    /**
     * Called when an obliqueCollection is added or removed to reset the item if needed
     * @param {import("@vcmap/core").ObliqueCollection} collection
     */
    const resetCallback = (collection) => {
      if (collection.name === this._collectionName) {
        this._setup();
      }
    };

    if (!this._collection) {
      this.visible = false;
      this._listeners.push(
        this._app.obliqueCollections.added.addEventListener(resetCallback),
      );
    } else {
      const map = this._app.maps.activeMap;
      if (map instanceof ObliqueMap) {
        this.visible = true;
        if (this._showWhenNotSupported) {
          this.disabled = false;
        }
        this.state =
          map.collection === this._collection
            ? StateActionState.ACTIVE
            : StateActionState.INACTIVE;
        this._listeners.push(
          map.collectionChanged.addEventListener(() => {
            this.state =
              map.collection === this._collection
                ? StateActionState.ACTIVE
                : StateActionState.INACTIVE;
          }),
        );
      } else {
        this.visible = this._showWhenNotSupported;
        if (this._showWhenNotSupported) {
          this.disabled = this._showWhenNotSupported;
        }
      }

      this.setPropertiesFromObject(this._collection);
      this._listeners.push(
        this._app.maps.mapActivated.addEventListener(() => {
          this._setup();
        }),
      );

      this._listeners.push(
        this._app.obliqueCollections.removed.addEventListener(resetCallback),
      );
      this._listeners.push(
        this._app.obliqueCollections.added.addEventListener(resetCallback),
      );
    }
  }

  async clicked() {
    await super.clicked();
    if (
      this.visible &&
      this._collection &&
      this._app.maps.activeMap instanceof ObliqueMap
    ) {
      const map = /** @type {import("@vcmap/core").Oblique} */ (
        this._app.maps.activeMap
      );
      const vp = await map.getViewpoint();
      if (this.state === StateActionState.INACTIVE) {
        this.state = StateActionState.LOADING;
        await map.setCollection(this._collection, vp);
        if (map.collection === this._collection) {
          executeCallbacks(this._app, this._onActivate);
        } else {
          // failed to activate collection
          this.state = StateActionState.INACTIVE;
        }
      } else if (this.state === StateActionState.ACTIVE) {
        this.state = StateActionState.INACTIVE;
        await map.setCollection(defaultCollection, vp);
        executeCallbacks(this._app, this._onDeactivate);
      }
    }
  }

  /**
   * @returns {ObliqueCollectionContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    config.collectionName = this._collectionName;
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    return config;
  }

  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default ObliqueCollectionContentTreeItem;
contentTreeClassRegistry.registerClass(
  ObliqueCollectionContentTreeItem.className,
  ObliqueCollectionContentTreeItem,
);
