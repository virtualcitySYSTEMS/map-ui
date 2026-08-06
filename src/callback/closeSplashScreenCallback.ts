import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

export default class CloseSplashScreenCallback extends VcsCallback {
  static get className(): string {
    return 'CloseSplashScreenCallback';
  }

  callback(): void {
    this._app.uiConfig.showSplashScreen.value = false;
  }
}

callbackClassRegistry.registerClass(
  CloseSplashScreenCallback.className,
  CloseSplashScreenCallback,
);
