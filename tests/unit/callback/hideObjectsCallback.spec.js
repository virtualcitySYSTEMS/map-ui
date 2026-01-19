import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeatureLayer } from '@vcmap/core';
import HideObjectsCallback from '../../../src/callback/hideObjectsCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';

describe('HideObjectsCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('hides objects on a specific feature layer if layerName is given', () => {
    const layer = new FeatureLayer({ name: 'myLayer' });

    app.layers.add(layer);

    const objectIds = ['a', 'b'];
    executeCallbacks(
      app,
      /** @type {any} */ ([
        {
          type: HideObjectsCallback.className,
          layerName: 'myLayer',
          objectIds,
        },
      ]),
    );

    expect(layer.featureVisibility.hiddenObjects).toHaveProperty('a');
    expect(layer.featureVisibility.hiddenObjects).toHaveProperty('b');
    expect(app.layers.globalHider.hiddenObjects).not.toHaveProperty('a');
    expect(app.layers.globalHider.hiddenObjects).not.toHaveProperty('b');
  });

  it('hides objects globally if no layerName is given', () => {
    const objectIds = ['id-1'];
    executeCallbacks(
      app,
      /** @type {any} */ ([{ type: HideObjectsCallback.className, objectIds }]),
    );

    expect(app.layers.globalHider.hiddenObjects).toHaveProperty('id-1');
  });
});
