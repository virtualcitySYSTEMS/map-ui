import { rotationMapControlSymbol } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

export default class StopRotationCallback extends VcsCallback {
  static get className(): string {
    return 'StopRotationCallback';
  }

  callback(): void {
    if (this._app.maps.exclusiveMapControlsId === rotationMapControlSymbol) {
      this._app.maps.resetExclusiveMapControls();
    }
  }
}

callbackClassRegistry.registerClass(
  StopRotationCallback.className,
  StopRotationCallback,
);
