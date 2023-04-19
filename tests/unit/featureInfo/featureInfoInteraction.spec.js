import {
  describe,
  beforeAll,
  afterAll,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { Cartesian2 } from '@vcmap-cesium/engine';
import {
  EventType,
  mercatorProjection,
  ModificationKeyType,
  PointerKeyType,
  VectorLayer,
} from '@vcmap/core';

import { Feature } from 'ol';
import VcsUiApp from '../../../src/vcsUiApp.js';
import FeatureInfoInteraction from '../../../src/featureInfo/featureInfoInteraction.js';
import TableFeatureInfoView from '../../../src/featureInfo/tableFeatureInfoView.js';

describe('FeatureInfoInteraction', () => {
  let interaction;
  let event;
  let app;
  let feature;

  beforeAll(() => {
    app = new VcsUiApp();
    app.featureInfo.collection.add(new TableFeatureInfoView({ name: 'foo' }));

    const layer = new VectorLayer({
      projection: mercatorProjection.toJSON(),
    });
    layer.properties.featureInfo = 'foo';
    app.layers.add(layer);
    feature = new Feature({});
    feature.setStyle(() => layer.style.style);
    layer.addFeatures([feature]);
    interaction = new FeatureInfoInteraction(app.featureInfo);
  });

  beforeEach(() => {
    event = {
      feature,
      type: EventType.CLICK,
      pointerEvent: PointerKeyType.LEFT,
      key: ModificationKeyType.NONE,
      windowPosition: new Cartesian2(1, 1),
      position: [0, 0],
    };
  });

  afterEach(() => {
    app.featureInfo.clear();
  });

  afterAll(() => {
    app.destroy();
    interaction.destroy();
  });

  it('the interaction should select any feature in the event', async () => {
    await interaction.pipe(event);
    expect(app.featureInfo.selectedFeature).to.equal(feature);
  });

  it('should stop propagation on the event', async () => {
    await interaction.pipe(event);
    expect(event).to.have.property('stopPropagation', true);
  });

  it('should not select a feature twice', async () => {
    await interaction.pipe(event);
    const spy = vi.spyOn(app.featureInfo, 'selectFeature');
    await interaction.pipe(event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should clear the feature, if the event has no feature', async () => {
    await interaction.pipe(event);
    delete event.feature;
    await interaction.pipe(event);
    expect(app.featureInfo.selectedFeature).to.be.null;
  });
});
