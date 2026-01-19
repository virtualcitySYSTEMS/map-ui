import { FlightInstance } from '@vcmap/core';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

/**
 * @typedef {import('@vcmap/core').FlightInstanceOptions} FlightInstanceOptions
 */

/**
 * @typedef {import('@vcmap/ui').VcsCallbackOptions & {
 *   flight: string | FlightInstanceOptions;
 * }} StartFlightCallbackOptions
 */

/**
 * A callback to start a flight.
 */
export default class StartFlightCallback extends VcsCallback {
  static get className() {
    return 'StartFlightCallback';
  }

  /** @type {string | FlightInstanceOptions} */
  _flight;

  /**
   * @param {StartFlightCallbackOptions} options
   * @param {import('@vcmap/ui').VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this._flight = options.flight;
  }

  /** @returns {Promise<void>} */
  async callback() {
    /** @type {import('@vcmap/ui').VcsUiApp} */
    const app = this._app;
    /** @type {FlightInstance | undefined} */
    let flight;
    if (typeof this._flight === 'string') {
      flight = app.flights.getByKey(this._flight);
    } else {
      flight = new FlightInstance(this._flight);
    }
    if (flight) {
      const player = await app.flights.setPlayerForFlight(flight);
      player?.play();
      return new Promise((resolve, reject) => {
        if (player) {
          const listener = player.stateChanged.addEventListener((state) => {
            if (state === 'stopped') {
              listener();
              resolve();
            }
          });
        } else {
          reject(new Error('No flight player available'));
        }
      });
    } else {
      return Promise.reject(new Error('Flight not found'));
    }
  }

  /** @returns {StartFlightCallbackOptions} */
  toJSON() {
    return {
      ...super.toJSON(),
      flight: structuredClone(this._flight),
    };
  }
}

callbackClassRegistry.registerClass(
  StartFlightCallback.className,
  StartFlightCallback,
);
