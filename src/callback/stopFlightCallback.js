import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   flightName: string;
 * }} StopFlightCallbackOptions
 */

/**
 * A callback to stop a flight.
 */
export default class StopFlightCallback extends VcsCallback {
  static get className() {
    return 'StopFlightCallback';
  }

  /** @type {string} */
  _flightName;

  /**
   * @param {StopFlightCallbackOptions} options
   * @param {import('@vcmap/ui').VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this._flightName = options.flightName;
  }

  callback() {
    /** @type {import('@vcmap/ui').VcsUiApp} */
    const app = this._app;
    if (app.flights.player?.flightInstanceName === this._flightName) {
      app.flights.player.stop();
    }
  }

  /** @returns {StopFlightCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      flightName: this._flightName,
    };
  }
}

callbackClassRegistry.registerClass(
  StopFlightCallback.className,
  StopFlightCallback,
);
