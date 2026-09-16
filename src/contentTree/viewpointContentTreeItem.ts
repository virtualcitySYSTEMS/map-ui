import type { Viewpoint } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import VcsObjectContentTreeItem from './vcsObjectContentTreeItem.js';
import {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';

type ViewpointContentTreeItemOptions = ContentTreeItemOptions & {
  viewpointName: string;
};

/**
 * A viewpoint item. Sets the viewpoint on the currently active map when clicked.
 */
class ViewpointContentTreeItem extends VcsObjectContentTreeItem {
  static get className(): string {
    return 'ViewpointContentTreeItem';
  }

  private _viewpointName: string;
  private _listeners: Array<() => void> = [];

  constructor(options: ViewpointContentTreeItemOptions, app: VcsUiApp) {
    options.icon = options.icon || '$vcsPoi'; // XXX _should_ this be the default?
    super(options, app);

    this._viewpointName = options.viewpointName;

    this._setup();
  }

  get viewpoint(): Viewpoint {
    return this._app.viewpoints.getByKey(this._viewpointName)!;
  }

  private _clearListeners(): void {
    this._listeners.forEach((cb) => {
      cb();
    });
    this._listeners.splice(0);
  }

  private _setup(): void {
    this._clearListeners();
    /**
     * Called when a viewpoint is added or removed to reset the item if needed
     */
    const resetCallback = (viewpoint: Viewpoint): void => {
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

  async clicked(): Promise<void> {
    await super.clicked();
    if (this._app.maps.activeMap && this.viewpoint) {
      await this._app.maps.activeMap.gotoViewpoint(this.viewpoint);
    }
  }

  toJSON(): ViewpointContentTreeItemOptions {
    const config = super.toJSON() as ViewpointContentTreeItemOptions;
    if (config.icon === '$vcsPoi') {
      delete config.icon;
    }

    config.viewpointName = this._viewpointName;
    return config;
  }

  destroy(): void {
    this._clearListeners();
    super.destroy();
  }
}

export default ViewpointContentTreeItem;
contentTreeClassRegistry.registerClass(
  ViewpointContentTreeItem.className,
  ViewpointContentTreeItem,
);
