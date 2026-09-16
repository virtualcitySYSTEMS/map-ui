import type { VcsObject } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  contentTreeClassRegistry,
  type ContentTreeItemOptions,
} from './contentTreeItem.js';

export type VcsObjectContentTreeItemProperties = {
  title?: string | Record<string, string>;
  tooltip?: string;
  icon?: string;
  infoUrl?: string;
};

/**
 * An abstract class for VcsObject based items.
 * It handles the overriding/setting of its own values based on
 * the VcsObjects properties bag.
 */
class VcsObjectContentTreeItem<
  T extends
    VcsObjectContentTreeItemProperties = VcsObjectContentTreeItemProperties,
> extends ContentTreeItem {
  static get className(): string {
    return 'VcsObjectContentTreeItem';
  }

  /** This object holds the properties which where configured on this item. */
  protected _ownProperties: Partial<T> = {};
  private _currentObjectProperties: Partial<T> = {};

  constructor(options: ContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    if (options.title) {
      this._ownProperties.title = options.title;
    }
    if (options.tooltip) {
      this._ownProperties.tooltip = options.tooltip;
    }
    if (options.icon) {
      this._ownProperties.icon = options.icon;
    }
    if (options.infoUrl) {
      this._ownProperties.infoUrl = options.infoUrl;
    }
  }

  /**
   * Sets the VcsObjects properties on the current item.
   * When extending this class with any other type, you must override this
   * method to set other values defined in your type.
   * This method is called, when the properties are set from this.setPropertiesFromObject.
   */
  protected _setProperties(properties: T): void {
    this.title = properties.title as string;
    this.tooltip = properties.tooltip;
    this.icon = properties.icon;
    this.infoUrl = properties.infoUrl ?? null;
  }

  /**
   * Sets the values on this item based on the objects properties bag.
   */
  setPropertiesFromObject(object: VcsObject): void {
    this._currentObjectProperties = structuredClone(
      object.properties,
    ) as Partial<T>;
    const mergedProperties = { ...this._currentObjectProperties };
    (Object.entries(this._ownProperties) as [keyof T, T[keyof T]][]).forEach(
      ([key, value]) => {
        if (value !== undefined) {
          mergedProperties[key] = value;
        }
      },
    );
    this._setProperties(mergedProperties as T);
  }

  toJSON(): ContentTreeItemOptions {
    const config = super.toJSON();
    (
      Object.entries(this._currentObjectProperties) as [
        keyof ContentTreeItemOptions,
        ContentTreeItemOptions[keyof ContentTreeItemOptions],
      ][]
    ).forEach(([key, value]) => {
      if (
        config[key] &&
        config[key] === value &&
        this._ownProperties[key as keyof T] !== value
      ) {
        delete config[key];
      }
    });

    return config;
  }
}

contentTreeClassRegistry.registerClass(
  VcsObjectContentTreeItem.className,
  VcsObjectContentTreeItem,
);
export default VcsObjectContentTreeItem;
