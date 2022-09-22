import {
  describe, expect, it, beforeAll, beforeEach, afterEach,
} from 'vitest';
import { OpenlayersMap, VectorLayer, VectorStyleItem } from '@vcmap/core';
import { getLegendEntries, createLayerLegendEntry } from '../../src/legend/legendHelper.js';
import VcsUiApp from '../../src/vcsUiApp.js';

const legend = [
  {
    type: 'IframeLegendItem',
    title: 'iframeLegend',
    src: '/exampleData/legendExample.html',
  },
];

const styleLegend = [
  {
    type: 'StyleLegendItem',
    colNr: 1,
    rows: [
      {
        type: 'FillLegendRow',
        fill: {
          color: '#edf8e9',
        },
        title: '< 5 m',
      },
    ],
  },
];

describe('createLegendEntries', () => {
  /** @type {VcsUiApp} */
  let app;
  let layer;
  let activeLayer;
  let inactiveLayer;
  let entries;
  let destroy;

  beforeAll(async () => {
    app = new VcsUiApp();
    app.maps.add(new OpenlayersMap({ name: 'ol' }));
    await app.maps.setActiveMap('ol');
    layer = new VectorLayer({ name: 'layer' });
    activeLayer = new VectorLayer({
      name: 'activeLayer',
      properties: { legend },
    });
    inactiveLayer = new VectorLayer({
      name: 'inactiveLayer',
      properties: { legend },
    });
    app.layers.add(layer);
    app.layers.add(activeLayer);
    app.layers.add(inactiveLayer);
    await layer.activate();
    await activeLayer.activate();
  });

  beforeEach(() => {
    ({ entries, destroy } = getLegendEntries(app));
  });

  afterEach(() => {
    destroy();
  });

  describe('adding legend entries', () => {
    it('should NOT create a legend entry for inactive layers', () => {
      const entry = entries.value.find(({ key }) => key === 'inactiveLayer');
      expect(entry).to.be.undefined;
    });

    it('should NOT create a legend entry, where no legend is configured on either layer or style', () => {
      const entry = entries.value.find(({ key }) => key === 'layer');
      expect(entry).to.be.undefined;
    });

    it('should create a legend entry for active layers with configured legend', () => {
      const expectedEntry = createLayerLegendEntry('activeLayer', 'activeLayer', legend);
      const entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.deep.equal(expectedEntry);
    });

    it('should create a legend entry for active layers having style with configured legend preferring the style legend over the layer legend', () => {
      const expectedEntry = createLayerLegendEntry('activeLayer', 'activeLayer', styleLegend);
      activeLayer.setStyle(new VectorStyleItem({ name: 'style', properties: { legend: styleLegend } }));
      const entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.deep.equal(expectedEntry);
      activeLayer.clearStyle();
    });
  });

  describe('updating legend entries', () => {
    it('should update a legend entry for layers with configured legend on activation', async () => {
      const expectedEntry = createLayerLegendEntry('inactiveLayer', 'inactiveLayer', legend);
      let entry = entries.value.find(({ key }) => key === 'inactiveLayer');
      expect(entry).to.be.undefined;
      await inactiveLayer.activate();
      entry = entries.value.find(({ key }) => key === 'inactiveLayer');
      expect(entry).to.deep.equal(expectedEntry);
      inactiveLayer.deactivate();
    });

    it('should update a legend entry on style change', () => {
      const expectedEntry = createLayerLegendEntry('activeLayer', 'activeLayer', styleLegend);
      activeLayer.setStyle(new VectorStyleItem({ name: 'style', properties: { legend: styleLegend } }));
      let entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.deep.equal(expectedEntry);
      const expectedEntryChanged = createLayerLegendEntry('activeLayer', 'activeLayer', legend);
      activeLayer.setStyle(new VectorStyleItem({ name: 'styleChanged', properties: { legend } }));
      entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.deep.equal(expectedEntryChanged);
      activeLayer.clearStyle();
    });
  });

  describe('removing legend entries', () => {
    it('should remove a legend entry for layers having style with configured legend on deactivation', async () => {
      layer.setStyle(new VectorStyleItem({ name: 'style', properties: { legend: styleLegend } }));
      const expectedEntry = createLayerLegendEntry('layer', 'layer', styleLegend);
      let entry = entries.value.find(({ key }) => key === 'layer');
      expect(entry).to.deep.equal(expectedEntry);
      layer.deactivate();
      entry = entries.value.find(({ key }) => key === 'layer');
      expect(entry).to.be.undefined;
      layer.clearStyle();
      await layer.activate();
    });

    it('should remove a legend entry for layers with configured legend on deactivation', async () => {
      const expectedEntry = createLayerLegendEntry('activeLayer', 'activeLayer', legend);
      let entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.deep.equal(expectedEntry);
      activeLayer.deactivate();
      entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.be.undefined;
      await activeLayer.activate();
    });

    it('should remove a legend entry for layers having no style after style change', () => {
      layer.setStyle(new VectorStyleItem({ name: 'style', properties: { legend: styleLegend } }));
      const expectedEntry = createLayerLegendEntry('layer', 'layer', styleLegend);
      const entry = entries.value.find(({ key }) => key === 'layer');
      expect(entry).to.deep.equal(expectedEntry);
      layer.clearStyle();
      expect(entries).to.not.have.property('layer');
    });

    it('should remove a legend entry when a layer is removed from the layerCollection of the activeMap', () => {
      app.maps.activeMap.layerCollection.remove(activeLayer);
      const entry = entries.value.find(({ key }) => key === 'activeLayer');
      expect(entry).to.be.undefined;
      app.maps.activeMap.layerCollection.add(activeLayer);
    });
  });
});
