import { getLogger } from '@vcsuite/logger';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type ActivateMapCallbackOptions = VcsCallbackOptions & {
  /** Name of the map to activate */
  mapName: string;
};

/**
 * Callback to activate a map by name using the app's map collection.
 */
export default class ActivateMapCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateMapCallback';
  }

  private _mapName: string;

  constructor(options: ActivateMapCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._mapName = options.mapName;
  }

  /**
   * Activates the map with the given name.
   */
  async callback(): Promise<void> {
    if (this._mapName) {
      try {
        await this._app.maps.setActiveMap(this._mapName);
      } catch (error) {
        getLogger(ActivateMapCallback.className).error(
          `Failed to activate map "${this._mapName}":`,
          error,
        );
      }
    }
  }

  toJSON(): ActivateMapCallbackOptions {
    const config = super.toJSON() as ActivateMapCallbackOptions;
    config.mapName = this._mapName;
    return config;
  }
}

callbackClassRegistry.registerClass(
  ActivateMapCallback.className,
  ActivateMapCallback,
);
