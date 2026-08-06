import { CesiumMap, startRotation } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type StartRotationOptions = VcsCallbackOptions & {
  /** Name of the viewpoint to start rotation from */
  viewpoint?: string;
  /** Time in seconds for a full rotation */
  timePerRotation?: number;
};

export default class StartRotationCallback extends VcsCallback {
  static get className(): string {
    return 'StartRotationCallback';
  }

  private _viewpoint: string | undefined;

  private _timePerRotation: number | undefined;

  constructor(options: StartRotationOptions, app: VcsUiApp) {
    super(options, app);
    this._viewpoint = options.viewpoint;
    this._timePerRotation = options.timePerRotation;
  }

  async callback(): Promise<void> {
    const vp = this._app.viewpoints.getByKey(this._viewpoint);
    const speed = this._timePerRotation;
    if (this._app.maps.activeMap instanceof CesiumMap) {
      await startRotation(this._app, vp, speed);
    }
  }
  toJSON(): StartRotationOptions {
    const config = super.toJSON() as StartRotationOptions;
    if (this._viewpoint) {
      config.viewpoint = this._viewpoint;
    }
    if (this._timePerRotation) {
      config.timePerRotation = this._timePerRotation;
    }
    return config;
  }
}

callbackClassRegistry.registerClass(
  StartRotationCallback.className,
  StartRotationCallback,
);
