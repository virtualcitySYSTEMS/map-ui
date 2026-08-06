import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * Callback to deactivate the overview map using its API.
 */
export default class DeactivateOverviewMapCallback extends VcsCallback {
  static get className(): string {
    return 'DeactivateOverviewMapCallback';
  }

  callback(): void {
    this._app.overviewMap.deactivate();
  }
}

callbackClassRegistry.registerClass(
  DeactivateOverviewMapCallback.className,
  DeactivateOverviewMapCallback,
);
