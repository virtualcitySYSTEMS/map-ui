import { expect, describe, beforeEach, afterEach, it } from 'vitest';
import { OpenlayersMap } from '@vcmap/core';
import { executeCallbacks, VcsUiApp } from '../../../index.js';
import ActivateMapCallback from '../../../src/callback/activateMapCallback.js';
import { sleep } from '../../helpers.js';

describe('ActivateMapCallback', () => {
  let app;
  const mapName = 'defaultMap';

  beforeEach(() => {
    app = new VcsUiApp();
    app.maps.add(new OpenlayersMap({ name: mapName }));
  });

  afterEach(() => {
    app.destroy();
  });

  it('should activate the map with the given name', async () => {
    executeCallbacks(app, [{ type: ActivateMapCallback.className, mapName }]);
    await sleep(100); // Allow time for the callback to process
    expect(app.maps.activeMap.name).to.equal(mapName);
  });

  it('should not change active map if the same map is activated again', async () => {
    await app.maps.setActiveMap(mapName);
    executeCallbacks(app, [{ type: ActivateMapCallback.className, mapName }]);
    await sleep(100); // Allow time for the callback to process
    expect(app.maps.activeMap.name).to.equal(mapName);
  });

  it('should handle errors when activating a non-existent map', async () => {
    executeCallbacks(app, [
      { type: ActivateMapCallback.className, mapName: 'nonExistentMap' },
    ]);
    await sleep(100); // Allow time for the callback to process
    expect(app.maps.activeMap).to.be.null; // No active map should be set
  });
});
