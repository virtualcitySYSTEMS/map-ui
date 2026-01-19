import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import StopFlightCallback from '../../../src/callback/stopFlightCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';

describe('StopFlightCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('stops the current flight player if the names match', () => {
    const stop = vi.fn();

    vi.spyOn(app.flights, 'player', 'get').mockReturnValue(
      /** @type {any} */ ({ flightInstanceName: 'myFlight', stop }),
    );

    const cb = new StopFlightCallback(
      { type: StopFlightCallback.className, flightName: 'myFlight' },
      app,
    );
    cb.callback();

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('does nothing if there is no player or the flight name differs', () => {
    const stop = vi.fn();

    vi.spyOn(app.flights, 'player', 'get').mockReturnValue(undefined);
    const cbNoPlayer = new StopFlightCallback(
      { type: StopFlightCallback.className, flightName: 'myFlight' },
      app,
    );
    expect(() => cbNoPlayer.callback()).not.toThrow();

    vi.spyOn(app.flights, 'player', 'get').mockReturnValue(
      /** @type {any} */ ({ flightInstanceName: 'otherFlight', stop }),
    );
    const cbDifferent = new StopFlightCallback(
      { type: StopFlightCallback.className, flightName: 'myFlight' },
      app,
    );
    cbDifferent.callback();

    expect(stop).not.toHaveBeenCalled();
  });
});
