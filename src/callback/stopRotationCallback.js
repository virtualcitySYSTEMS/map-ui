import { rotationMapControlSymbol } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @class
 * @extends {VcsCallback}
 */
class StopRotationCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'StopRotationCallback';
  }

  // eslint-disable-next-line class-methods-use-this
  callback() {
    if (this._app.maps.exclusiveMapControlsId === rotationMapControlSymbol) {
      this._app.maps.resetExclusiveMapControls();
    }
  }

  /**
   * @returns {import('./vcsCallback.js').VcsCallbackOptions}
   */
  toJSON() {
    return super.toJSON();
  }
}

export default StopRotationCallback;

// Register the class
callbackClassRegistry.registerClass(
  StopRotationCallback.className,
  StopRotationCallback,
);
