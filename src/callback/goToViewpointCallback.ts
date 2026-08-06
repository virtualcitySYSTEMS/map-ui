import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type GoToViewpointOptions = VcsCallbackOptions & {
  /** Name of the viewpoint */
  viewpoint: string;
};

export default class GoToViewpointCallback extends VcsCallback {
  static get className(): string {
    return 'GoToViewpointCallback';
  }

  private _viewpoint: string;
  constructor(options: GoToViewpointOptions, app: VcsUiApp) {
    super(options, app);
    this._viewpoint = options.viewpoint;
  }

  async callback(): Promise<void> {
    const vp = this._app.viewpoints.getByKey(this._viewpoint);
    if (this._app.maps.activeMap && vp) {
      await this._app.maps.activeMap.gotoViewpoint(vp);
    }
  }
  toJSON(): GoToViewpointOptions {
    const config = super.toJSON() as GoToViewpointOptions;
    config.viewpoint = this._viewpoint;
    return config;
  }
}

callbackClassRegistry.registerClass(
  GoToViewpointCallback.className,
  GoToViewpointCallback,
);
