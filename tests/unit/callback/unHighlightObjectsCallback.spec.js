import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FeatureLayer, Layer, VectorStyleItem } from '@vcmap/core';
import UnHighlightObjectsCallback from '../../../src/callback/unHighlightObjectsCallback.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { executeCallbacks } from '../../../src/callback/vcsCallback.js';

describe('UnHighlightObjectsCallback', () => {
  /** @type {VcsUiApp} */
  let app;

  beforeEach(() => {
    app = new VcsUiApp();
  });

  afterEach(() => {
    app.destroy();
  });

  it('unhighlights objects on a feature layer', () => {
    const layer = new FeatureLayer({ name: 'myLayer' });

    app.layers.add(layer);
    const getByKeySpy = vi.spyOn(app.layers, 'getByKey');

    const toUnHighlight = ['id-1', 2];
    layer.featureVisibility.highlight({
      'id-1': new VectorStyleItem({ name: 'x' }),
      2: new VectorStyleItem({ name: 'y' }),
    });
    expect(layer.featureVisibility.highlightedObjects).toHaveProperty('id-1');
    expect(layer.featureVisibility.highlightedObjects).toHaveProperty('2');

    executeCallbacks(
      app,
      /** @type {any} */ ([
        {
          type: UnHighlightObjectsCallback.className,
          layerName: 'myLayer',
          toUnHighlight,
        },
      ]),
    );

    expect(getByKeySpy).toHaveBeenCalledWith('myLayer');
    expect(layer.featureVisibility.highlightedObjects).not.toHaveProperty(
      'id-1',
    );
    expect(layer.featureVisibility.highlightedObjects).not.toHaveProperty('2');
  });

  it('does nothing if the layer is not a FeatureLayer', () => {
    const layer = new Layer({ name: 'notAFeatureLayer' });
    app.layers.add(layer);

    const getByKeySpy = vi.spyOn(app.layers, 'getByKey');

    expect(() =>
      executeCallbacks(
        app,
        /** @type {any} */ ([
          {
            type: UnHighlightObjectsCallback.className,
            layerName: 'notAFeatureLayer',
            toUnHighlight: ['id'],
          },
        ]),
      ),
    ).not.toThrow();

    expect(getByKeySpy).toHaveBeenCalledWith('notAFeatureLayer');
  });
});
