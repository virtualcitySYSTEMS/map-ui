import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeatureLayer } from '@vcmap/core';
import ShowObjectsCallback from '../../../src/callback/showObjectsCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';

describe('ShowObjectsCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('shows objects on a specific feature layer if layerName is given', () => {
    const layer = new FeatureLayer({ name: 'myLayer' });

    app.layers.add(layer);

    const objectIds = ['a', 'b'];
    layer.featureVisibility.hideObjects(objectIds);
    expect(layer.featureVisibility.hiddenObjects).toHaveProperty('a');
    expect(layer.featureVisibility.hiddenObjects).toHaveProperty('b');

    executeCallbacks(
      app,
      /** @type {any} */ ([
        {
          type: ShowObjectsCallback.className,
          layerName: 'myLayer',
          objectIds,
        },
      ]),
    );

    expect(layer.featureVisibility.hiddenObjects).not.toHaveProperty('a');
    expect(layer.featureVisibility.hiddenObjects).not.toHaveProperty('b');
    expect(app.layers.globalHider.hiddenObjects).not.toHaveProperty('a');
    expect(app.layers.globalHider.hiddenObjects).not.toHaveProperty('b');
  });

  it('shows objects globally if no layerName is given', () => {
    const objectIds = ['id-1'];
    app.layers.globalHider.hideObjects(objectIds);
    expect(app.layers.globalHider.hiddenObjects).toHaveProperty('id-1');

    executeCallbacks(
      app,
      /** @type {any} */ ([{ type: ShowObjectsCallback.className, objectIds }]),
    );

    expect(app.layers.globalHider.hiddenObjects).not.toHaveProperty('id-1');
  });
});
