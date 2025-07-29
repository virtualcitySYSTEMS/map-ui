import { getLogger } from '@vcsuite/logger';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * Callback to activate the overview map using its API.
 */
class ActivateOverviewMapCallback extends VcsCallback {
  static get className() {
    return 'ActivateOverviewMapCallback';
  }

  callback() {
    this._app.overviewMap.activate().catch((error) => {
      getLogger(ActivateOverviewMapCallback.className).error(
        'Failed to activate overview map:',
        error,
      );
    });
  }
}

callbackClassRegistry.registerClass(
  ActivateOverviewMapCallback.className,
  ActivateOverviewMapCallback,
);
export default ActivateOverviewMapCallback;
