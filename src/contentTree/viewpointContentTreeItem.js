import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import { contentTreeClassRegistry } from './contentTreeItem.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { viewpointName: string }} ViewpointContentTreeItemOptions
 */

/**
 * A viewpoint item. Sets the viewpoint on the currently active map when clicked.
 * @extends {VcsObjectContentTreeItem<VcsObjectContentTreeItemProperties>}
 * @class
 */
class ViewpointContentTreeItem extends VcsObjectContentTreeItem {
  static get className() {
    return 'ViewpointContentTreeItem';
  }

  /**
   * @param {ViewpointContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    options.icon = options.icon || '$vcsPoi'; // XXX _should_ this be the default?
    super(options, app);

    /**
     * @type {string}
     * @private
     */
    this._viewpointName = options.viewpointName;

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @returns {import("@vcmap/core").Viewpoint}
   */
  get viewpoint() {
    return this._app.viewpoints.getByKey(this._viewpointName);
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
     * Called when a viewpoint is added or removed to reset the item if needed
     * @param {import("@vcmap/core").Viewpoint} viewpoint
     */
    const resetCallback = (viewpoint) => {
      if (viewpoint.name === this._viewpointName) {
        this._setup();
      }
    };

    if (!this.viewpoint) {
      this.visible = false;
      this._listeners.push(
        this._app.viewpoints.added.addEventListener(resetCallback),
      );
    } else {
      this.visible = true;
      this.setPropertiesFromObject(this.viewpoint);
      this._listeners.push(
        this._app.viewpoints.added.addEventListener(resetCallback),
      );
      this._listeners.push(
        this._app.viewpoints.removed.addEventListener(resetCallback),
      );
    }
  }

  async clicked() {
    await super.clicked();
    if (this._app.maps.activeMap && this.viewpoint) {
      await this._app.maps.activeMap.gotoViewpoint(this.viewpoint);
    }
  }

  /**
   * @returns {ViewpointContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (config.icon === '$vcsPoi') {
      delete config.icon;
    }

    config.viewpointName = this._viewpointName;
    return config;
  }

  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default ViewpointContentTreeItem;
contentTreeClassRegistry.registerClass(
  ViewpointContentTreeItem.className,
  ViewpointContentTreeItem,
);
