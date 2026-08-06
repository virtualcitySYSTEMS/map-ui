import { getLogger } from '@vcsuite/logger';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * Callback to activate the overview map using its API.
 */
export default class ActivateOverviewMapCallback extends VcsCallback {
  static get className(): string {
    return 'ActivateOverviewMapCallback';
  }

  async callback(): Promise<void> {
    try {
      await this._app.overviewMap.activate();
    } catch (error) {
      getLogger(ActivateOverviewMapCallback.className).error(
        'Failed to activate overview map:',
        error,
      );
    }
  }
}

callbackClassRegistry.registerClass(
  ActivateOverviewMapCallback.className,
  ActivateOverviewMapCallback,
);
