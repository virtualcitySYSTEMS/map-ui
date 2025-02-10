import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @class
 * @extends {VcsCallback}
 */
class CloseSplashScreenCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'CloseSplashScreenCallback';
  }

  callback() {
    this._app.uiConfig.showSplashScreen.value = false;
  }

  /**
   * @returns {import('./vcsCallback.js').VcsCallbackOptions}
   */
  toJSON() {
    return super.toJSON();
  }
}

export default CloseSplashScreenCallback;

// Register the class
callbackClassRegistry.registerClass(
  CloseSplashScreenCallback.className,
  CloseSplashScreenCallback,
);
