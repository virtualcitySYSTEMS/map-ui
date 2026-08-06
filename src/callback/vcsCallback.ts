import { ClassRegistry } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';

export const callbackClassRegistry = new ClassRegistry();

/**
 * Creates instances of VcsCallback classes and executes their `callback()`.
 *
 * Note: this function does not await promise-returning callbacks.
 */
export function executeCallbacks(
  app: VcsUiApp,
  vcsCallbackOptions: VcsCallbackOptions[],
): void {
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  vcsCallbackOptions.forEach((options) =>
    app.callbackClassRegistry.createFromTypeOptions(options, app)?.callback(),
  );
}

/**
 * Creates instances of VcsCallback classes and executes their `callback()` sequentially.
 * Awaits promise-returning callbacks before continuing with the next one.
 */
export async function executeAsyncCallbacks(
  app: VcsUiApp,
  vcsCallbackOptions: VcsCallbackOptions[],
): Promise<void> {
  for (const options of vcsCallbackOptions) {
    const callbackInstance = app.callbackClassRegistry.createFromTypeOptions(
      options,
      app,
    );
    if (callbackInstance) {
      // eslint-disable-next-line no-await-in-loop
      await callbackInstance.callback();
    }
  }
}

export type VcsCallbackOptions = {
  type: string;
};

export default abstract class VcsCallback {
  static get className(): string {
    return 'VcsCallback';
  }

  protected _app: VcsUiApp;

  constructor(_options: VcsCallbackOptions, app: VcsUiApp) {
    this._app = app;
  }

  abstract callback(): void | Promise<void>;

  toJSON(): VcsCallbackOptions {
    return {
      type: (this.constructor as typeof VcsCallback).className,
    };
  }
}
