import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * Callback to deactivate the overview map using its API.
 */
class DeactivateOverviewMapCallback extends VcsCallback {
  static get className() {
    return 'DeactivateOverviewMapCallback';
  }

  callback() {
    this._app.overviewMap.deactivate();
  }
}

callbackClassRegistry.registerClass(
  DeactivateOverviewMapCallback.className,
  DeactivateOverviewMapCallback,
);
export default DeactivateOverviewMapCallback;
