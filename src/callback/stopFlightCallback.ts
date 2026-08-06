import type VcsUiApp from '../vcsUiApp.js';
import type { VcsCallbackOptions } from './vcsCallback.js';
import VcsCallback, { callbackClassRegistry } from './vcsCallback.js';

type StopFlightCallbackOptions = VcsCallbackOptions & {
  /** Name of the flight to stop */
  flightName: string;
};

/**
 * A callback to stop a flight.
 */
export default class StopFlightCallback extends VcsCallback {
  static get className(): string {
    return 'StopFlightCallback';
  }

  private _flightName: string;

  constructor(options: StopFlightCallbackOptions, app: VcsUiApp) {
    super(options, app);
    this._flightName = options.flightName;
  }

  callback(): void {
    const app = this._app;
    if (app.flights.player?.flightInstanceName === this._flightName) {
      app.flights.player.stop();
    }
  }

  toJSON(): StopFlightCallbackOptions {
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
