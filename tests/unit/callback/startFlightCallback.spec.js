import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VcsEvent, FlightInstance } from '@vcmap/core';
import StartFlightCallback from '../../../src/callback/startFlightCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';

describe('StartFlightCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('starts a named flight and resolves when the player stops', async () => {
    const flight = new FlightInstance({ name: 'myFlight' });
    app.flights.add(flight);

    const stateChanged = new VcsEvent();
    const player = {
      play: vi.fn(),
      stateChanged,
    };

    vi.spyOn(app.flights, 'setPlayerForFlight').mockResolvedValue(
      /** @type {any} */ (player),
    );

    const cb = new StartFlightCallback(
      { type: StartFlightCallback.className, flight: 'myFlight' },
      app,
    );
    const promise = cb.callback();

    // allow callback to attach listener
    await Promise.resolve();
    stateChanged.raiseEvent('stopped');

    await expect(promise).resolves.toBeUndefined();
    expect(app.flights.getByKey('myFlight')).toBe(flight);
    expect(app.flights.setPlayerForFlight).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it('rejects if the named flight does not exist', async () => {
    const setPlayerSpy = vi.spyOn(app.flights, 'setPlayerForFlight');

    const cb = new StartFlightCallback(
      { type: StartFlightCallback.className, flight: 'missing' },
      app,
    );
    await expect(cb.callback()).rejects.toThrow('Flight not found');
    expect(setPlayerSpy).not.toHaveBeenCalled();
  });

  it('rejects if no flight player is available', async () => {
    const flight = new FlightInstance({ name: 'myFlight' });
    app.flights.add(flight);
    vi.spyOn(app.flights, 'setPlayerForFlight').mockResolvedValue(undefined);

    const cb = new StartFlightCallback(
      { type: StartFlightCallback.className, flight: 'myFlight' },
      app,
    );
    await expect(cb.callback()).rejects.toThrow('No flight player available');
  });
});
