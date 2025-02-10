import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @class
 * @extends {VcsCallback}
 */
class OpenSplashScreenCallback extends VcsCallback {
  /**
   * @type {string}
   */
  static get className() {
    return 'OpenSplashScreenCallback';
  }

  callback() {
    if (this._app.uiConfig.getByKey('splashScreen')) {
      this._app.uiConfig.showSplashScreen.value = true;
    }
  }

  /**
   * @returns {import('./vcsCallback.js').VcsCallbackOptions}
   */
  toJSON() {
    return super.toJSON();
  }
}

export default OpenSplashScreenCallback;

// Register the class
callbackClassRegistry.registerClass(
  OpenSplashScreenCallback.className,
  OpenSplashScreenCallback,
);
