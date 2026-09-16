import {
  DefaultObliqueCollection,
  type ObliqueCollection,
  ObliqueMap,
} from '@vcmap/core';
import { parseBoolean } from '@vcsuite/parsers';
import type VcsUiApp from '../vcsUiApp.js';
import VcsObjectContentTreeItem, {
  type VcsObjectContentTreeItemProperties,
} from './vcsObjectContentTreeItem.js';
import { setViewpointAction } from './layerContentTreeItem.js';
import { StateActionState } from '../actions/stateRefAction.js';
import {
  type ContentTreeItemOptions,
  contentTreeClassRegistry,
} from './contentTreeItem.js';
import { executeCallbacks } from '../callback/vcsCallback.js';

type ObliqueCollectionContentTreeItemOptions = ContentTreeItemOptions & {
  collectionName: string;
  /** optional flag to show the item even if it is not supported by the activeMap. */
  showWhenNotSupported?: boolean;
};

type ObliqueCollectionContentTreeItemProperties =
  VcsObjectContentTreeItemProperties & {
    defaultViewpoint?: string;
  };

const defaultCollection = new DefaultObliqueCollection();

/**
 * An oblique collection item. Sets/unsets the oblique collection when clicked.
 */
class ObliqueCollectionContentTreeItem extends VcsObjectContentTreeItem<ObliqueCollectionContentTreeItemProperties> {
  static get className(): string {
    return 'ObliqueCollectionContentTreeItem';
  }

  private _collectionName: string;
  private _showWhenNotSupported: boolean;
  private _listeners: Array<() => void> = [];

  constructor(options: ObliqueCollectionContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);
    this.state = StateActionState.INACTIVE;

    this._collectionName = options.collectionName;
    this._showWhenNotSupported = parseBoolean(
      options.showWhenNotSupported,
      false,
    );

    this._setup();
  }

  private get _collection(): ObliqueCollection | undefined {
    return this._app.obliqueCollections.getByKey(this._collectionName);
  }

  protected _setProperties(
    properties: ObliqueCollectionContentTreeItemProperties,
  ): void {
    super._setProperties(properties);

    setViewpointAction(this, this._app, properties.defaultViewpoint);
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
     * Called when an obliqueCollection is added or removed to reset the item if needed
     */
    const resetCallback = (collection: ObliqueCollection): void => {
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

  async clicked(): Promise<void> {
    await super.clicked();
    if (
      this.visible &&
      this._collection &&
      this._app.maps.activeMap instanceof ObliqueMap
    ) {
      const map = this._app.maps.activeMap;
      const vp = (await map.getViewpoint())!;
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

  toJSON(): ObliqueCollectionContentTreeItemOptions {
    const config = super.toJSON() as ObliqueCollectionContentTreeItemOptions;
    config.collectionName = this._collectionName;
    if (this._showWhenNotSupported) {
      config.showWhenNotSupported = this._showWhenNotSupported;
    }
    return config;
  }

  destroy(): void {
    this._clearListeners();
    super.destroy();
  }
}

export default ObliqueCollectionContentTreeItem;
contentTreeClassRegistry.registerClass(
  ObliqueCollectionContentTreeItem.className,
  ObliqueCollectionContentTreeItem,
);
