import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

export default class OpenSplashScreenCallback extends VcsCallback {
  static get className(): string {
    return 'OpenSplashScreenCallback';
  }

  callback(): void {
    if (this._app.uiConfig.getByKey('splashScreen')) {
      this._app.uiConfig.showSplashScreen.value = true;
    }
  }
}

callbackClassRegistry.registerClass(
  OpenSplashScreenCallback.className,
  OpenSplashScreenCallback,
);
