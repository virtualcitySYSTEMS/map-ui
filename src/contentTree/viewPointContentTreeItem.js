import { VcsClassRegistry } from '@vcmap/core';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';

/**
 * @typedef {VcsObjectContentTreeItem.Options} ViewPointContentTreeItemOptions
 * @property {string} viewpointName
 */

/**
 * A viewpoint item. Sets the viewpoint on the currently active map when clicked.
 * @extends {VcsObjectContentTreeItem<VcsObjectContentTreeItemProperties>}
 * @class
 */
class ViewPointContentTreeItem extends VcsObjectContentTreeItem {
  static get className() { return 'ViewPointContentTreeItem'; }

  /**
   * @param {ViewPointContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    options.icon = options.icon || '$vcsPoi'; // XXX _should_ this be the default?
    super(options, app);

    /**
     * @type {string}
     * @private
     */
    this._viewPointName = options.viewpointName;

    /**
     * @type {Array<function():void>}
     * @private
     */
    this._listeners = [];

    this._setup();
  }

  /**
   * @returns {import("@vcmap/core").ViewPoint}
   */
  get viewPoint() {
    return this._app.viewPoints.getByKey(this._viewPointName);
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => { cb(); });
    this._listeners.splice(0);
  }

  /**
   * @private
   */
  _setup() {
    this._clearListeners();
    /**
     * Called when a viewPoint is added or removed to reset the item if needed
     * @param {import("@vcmap/core").ViewPoint} viewPoint
     */
    const resetCallback = (viewPoint) => {
      if (viewPoint.name === this._viewPointName) {
        this._setup();
      }
    };

    if (!this.viewPoint) {
      this.visible = false;
      this._listeners.push(this._app.viewPoints.added.addEventListener(resetCallback));
    } else {
      this.visible = true;
      this.setPropertiesFromObject(this.viewPoint);
      this._listeners.push(this._app.viewPoints.added.addEventListener(resetCallback));
      this._listeners.push(this._app.viewPoints.removed.addEventListener(resetCallback));
    }
  }

  async clicked() {
    if (this._app.maps.activeMap && this.viewPoint) {
      await this._app.maps.activeMap.gotoViewPoint(this.viewPoint);
    }
  }

  /**
   * @returns {ViewPointContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (config.icon === '$vcsPoi') {
      delete config.icon;
    }

    config.viewpointName = this._viewPointName;
    return config;
  }

  destroy() {
    this._clearListeners();
    super.destroy();
  }
}

export default ViewPointContentTreeItem;
VcsClassRegistry.registerClass(ViewPointContentTreeItem.className, ViewPointContentTreeItem);
