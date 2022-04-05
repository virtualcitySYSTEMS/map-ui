import { VcsClassRegistry } from '@vcmap/core';
import ContentTreeItem from './contentTreeItem.js';

/**
 * @typedef {Object} VcsObjectContentTreeItemProperties
 * @property {string|Object<string, string>} [title]
 * @property {string} [icon]
 * @property {string} [infoUrl]
 */

/**
 * An abstract class for VcsObject based items.
 * It handle the overriding/setting of its own values based on
 * the VcsObjects properties bag.
 * @class
 * @template {VcsObjectContentTreeItemProperties} T
 * @extends {ContentTreeItem}
 * @abstract
 */
class VcsObjectContentTreeItem extends ContentTreeItem {
  /**
   * @type {string}
   * @readonly
   */
  static get className() { return 'VcsObjectContentTreeItem'; }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    /**
     * This object holds the properties which where configured on this item.
     * @type {T}
     * @protected
     */
    this._ownProperties = {
      title: this.title,
      icon: this.icon,
      infoUrl: this.infoUrl,
    };

    /**
     * @type {T}
     * @private
     */
    this._currentObjectProperties = {};
  }

  /**
   * Sets the VcsObjects properties on the current item.
   * When extending this class with any other type, you must override this
   * method to set other values defined in your type.
   * This method is called, when the properties are set from this.setPropertiesFromObject.
   * @param {T} properties
   * @protected
   */
  _setProperties(properties) {
    this.title = properties.title;
    this.icon = properties.icon;
    this.infoUrl = properties.infoUrl;
  }

  /**
   * Sets the values on this item based on the objects properties bag.
   * @param {import("@vcmap/core").VcsObject} object
   */
  setPropertiesFromObject(object) {
    this._currentObjectProperties = object.properties;
    const mergedProperties = { ...this._currentObjectProperties };
    Object.entries(this._ownProperties)
      .forEach(([key, value]) => {
        if (value !== undefined) {
          mergedProperties[key] = value;
        }
      });
    this._setProperties(mergedProperties);
  }

  /**
   * @returns {ContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    Object.entries(this._currentObjectProperties)
      .forEach(([key, value]) => {
        if (config[key] && config[key] === value && this._ownProperties[key] !== value) {
          delete config[key];
        }
      });

    return config;
  }
}

VcsClassRegistry.registerClass(VcsObjectContentTreeItem.className, VcsObjectContentTreeItem);
export default VcsObjectContentTreeItem;
