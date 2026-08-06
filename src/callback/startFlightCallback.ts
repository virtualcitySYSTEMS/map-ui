import { FlightInstance } from '@vcmap/core';
import type { FlightInstanceOptions } from '@vcmap/core';
import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type StartFlightCallbackOptions = VcsCallbackOptions & {
  /** Name of an existing flight or an inline flight instance config */
  flight: string | FlightInstanceOptions;
};

/**
 * A callback to start a flight.
 */
export default class StartFlightCallback extends VcsCallback {
  static get className(): string {
    return 'StartFlightCallback';
  }

  private _flight: string | FlightInstanceOptions;

  constructor(options: StartFlightCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._flight = options.flight;
  }

  async callback(): Promise<void> {
    const app = this._app;
    let flight: FlightInstance | undefined;
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

  toJSON(): StartFlightCallbackOptions {
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
