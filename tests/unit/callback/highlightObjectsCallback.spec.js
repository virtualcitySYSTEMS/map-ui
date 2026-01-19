import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FeatureLayer, Layer } from '@vcmap/core';
import HighlightObjectsCallback from '../../../src/callback/highlightObjectsCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';

describe('HighlightObjectsCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('highlights objects on a feature layer', () => {
    const layer = new FeatureLayer({ name: 'myLayer' });

    app.layers.add(layer);
    const toHighlight = {
      a: { name: 'styleA' },
      b: { name: 'styleB' },
    };

    executeCallbacks(
      app,
      /** @type {any} */ ([
        {
          type: HighlightObjectsCallback.className,
          layerName: 'myLayer',
          toHighlight,
        },
      ]),
    );

    expect(layer.featureVisibility.highlightedObjects).toHaveProperty('a');
    expect(layer.featureVisibility.highlightedObjects).toHaveProperty('b');

    expect(
      /** @type {any} */ (layer.featureVisibility.highlightedObjects.a.style)
        .name,
    ).toBe('styleA');
    expect(
      /** @type {any} */ (layer.featureVisibility.highlightedObjects.b.style)
        .name,
    ).toBe('styleB');
  });

  it('does nothing if the layer is not a FeatureLayer', () => {
    const layer = new Layer({ name: 'notAFeatureLayer' });
    app.layers.add(layer);
    expect(() =>
      executeCallbacks(
        app,
        /** @type {any} */ ([
          {
            type: HighlightObjectsCallback.className,
            layerName: 'notAFeatureLayer',
            toHighlight: { a: { name: 'x' } },
          },
        ]),
      ),
    ).not.toThrow();
  });
});
