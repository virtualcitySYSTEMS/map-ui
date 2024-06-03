import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import {
  CesiumTilesetLayer,
  ObliqueMap,
  OpenlayersMap,
  VectorLayer,
} from '@vcmap/core';
import VcsUiApp from '../../src/vcsUiApp.js';
import {
  getAttributions,
  mergeAttributions,
} from '../../src/application/attributionsHelper.js';

const getKey = (object) => `${object.className}_${object.name}`;

const getDummyAttribution = (provider, year) => ({
  provider,
  year,
  url: `https://${provider}/${year}`,
});

describe('createAttributionEntries', () => {
  describe('adding attribution entries', () => {
    /** @type {VcsUiApp} */
    let app;
    let olMap;
    let obliqueMap;
    let entries;
    let destroy;
    let activeLayer;
    let activeLayer2;
    let inactiveLayer;
    let cesiumLayer;

    beforeAll(async () => {
      app = new VcsUiApp();
      olMap = new OpenlayersMap({
        name: 'ol',
        properties: {
          attributions: {
            provider: 'Open Layers',
            url: 'https://openlayers.org/',
          },
        },
      });
      obliqueMap = new ObliqueMap({
        name: 'oblique',
        properties: {
          attributions: [
            {
              provider: 'Open Layers',
              url: 'https://openlayers.org/',
            },
            {
              provider: 'VCS',
              url: 'https://vc.systems/en/',
            },
          ],
        },
      });
      app.maps.add(olMap);
      app.maps.add(obliqueMap);
      activeLayer = new VectorLayer({
        name: 'activeLayer',
        properties: { attributions: getDummyAttribution('foo', 2022) },
      });
      activeLayer2 = new VectorLayer({
        name: 'activeLayer2',
        properties: { attributions: [getDummyAttribution('foo', 2023)] },
      });
      inactiveLayer = new VectorLayer({
        name: 'inactiveLayer',
        properties: { attributions: getDummyAttribution('bar', 2022) },
      });
      cesiumLayer = new CesiumTilesetLayer({
        name: 'cesiumLayer',
        properties: { attributions: getDummyAttribution('bar', 2023) },
      });
      app.layers.add(activeLayer);
      app.layers.add(activeLayer2);
      app.layers.add(inactiveLayer);
      app.layers.add(cesiumLayer);
      await activeLayer.activate();
      await activeLayer2.activate();
      await cesiumLayer.activate();
      ({ entries, destroy } = getAttributions(app));
      await app.maps.setActiveMap('ol');
    });

    afterAll(() => {
      destroy();
      app.destroy();
    });

    it('should create an attribution entry for each active map, layer or oblique collection with configured attribution', () => {
      expect(entries).to.have.length(3);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(olMap),
        getKey(activeLayer),
        getKey(activeLayer2),
      ]);
    });

    it('should create attribution entries for objects of different className with same name', async () => {
      const layer = new VectorLayer({
        name: 'ol',
        properties: { attributions: getDummyAttribution('bar', 2022) },
      });
      app.layers.add(layer);
      await layer.activate();
      expect(entries).to.have.length(4);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(olMap),
        getKey(activeLayer),
        getKey(activeLayer2),
        getKey(layer),
      ]);
      layer.deactivate();
      app.layers.remove(layer);
    });

    it('should NOT create an attribution entry for inactive layers', () => {
      const entry = entries.find((e) => e.key === getKey(inactiveLayer));
      expect(entry).to.be.undefined;
    });

    it('should NOT create an attribution entry for inactive maps', () => {
      const entry = entries.find((e) => e.key === getKey(obliqueMap));
      expect(entry).to.be.undefined;
    });

    it('should NOT create an attribution entry for not supported layers of current map', () => {
      const entry = entries.find((e) => e.key === getKey(cesiumLayer));
      expect(entry).to.be.undefined;
    });
  });

  describe('updating attribution entries', () => {
    /** @type {VcsUiApp} */
    let app;
    let entries;
    let destroy;
    let inactiveLayer;

    beforeAll(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      app.maps.add(new ObliqueMap({ name: 'oblique' }));
      inactiveLayer = new VectorLayer({
        name: 'inactiveLayer',
        properties: { attributions: getDummyAttribution('bar', 2022) },
      });
      app.layers.add(inactiveLayer);
      ({ entries, destroy } = getAttributions(app));
      await app.maps.setActiveMap('ol');
    });

    afterAll(() => {
      destroy();
      app.destroy();
    });

    it('should update a attribution entry for layers with configured attribution on activation', async () => {
      const key = getKey(inactiveLayer);
      let entry = entries.find((e) => e.key === key);
      expect(entry).to.be.undefined;
      await inactiveLayer.activate();
      entry = entries.find((e) => e.key === key);
      expect(entry).to.deep.equal({
        key,
        title: `${inactiveLayer.className}: ${inactiveLayer.name}`,
        attributions: [inactiveLayer.properties.attributions],
      });
      inactiveLayer.deactivate();
    });

    it('should update all attributions on map change', async () => {
      await app.maps.setActiveMap('oblique');
      expect(entries).to.have.length(0);
      await app.maps.setActiveMap('ol');
    });
  });

  describe('removing attribution entries', () => {
    /** @type {VcsUiApp} */
    let app;
    let entries;
    let destroy;
    let activeLayer;
    let activeLayer2;

    beforeAll(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      activeLayer = new VectorLayer({
        name: 'activeLayer',
        properties: { attributions: getDummyAttribution('foo', 2022) },
      });
      activeLayer2 = new VectorLayer({
        name: 'activeLayer2',
        properties: { attributions: getDummyAttribution('bar', 2023) },
      });
      app.layers.add(activeLayer);
      app.layers.add(activeLayer2);
      await activeLayer.activate();
      await activeLayer2.activate();
      ({ entries, destroy } = getAttributions(app));
      await app.maps.setActiveMap('ol');
    });

    afterAll(() => {
      destroy();
      app.destroy();
    });

    it('should remove a attribution entry for layers with configured attribution on deactivation', async () => {
      expect(entries).to.have.length(2);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(activeLayer),
        getKey(activeLayer2),
      ]);
      activeLayer.deactivate();
      expect(entries).to.have.length(1);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(activeLayer2),
      ]);
      await activeLayer.activate();
    });

    it('should remove a attribution entry when a layer is removed from the layerCollection of the activeMap', () => {
      expect(entries).to.have.length(2);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(activeLayer),
        getKey(activeLayer2),
      ]);
      app.maps.activeMap.layerCollection.remove(activeLayer);
      expect(entries).to.have.length(1);
      expect(entries.map(({ key }) => key)).to.have.members([
        getKey(activeLayer2),
      ]);
      app.maps.activeMap.layerCollection.add(activeLayer);
    });
  });

  describe('merging multiple attribution entries', () => {
    let entries;
    let attributions;

    beforeAll(async () => {
      entries = [
        { key: 'layer1', attributions: [getDummyAttribution('foo', 2022)] },
        {
          key: 'layer2',
          attributions: [
            { provider: 'foo' },
            getDummyAttribution('foo', 2023),
            getDummyAttribution('foo', 2024),
          ],
        },
        { key: 'layer3', attributions: [getDummyAttribution('bar', 2022)] },
      ];
      attributions = mergeAttributions(entries);
    });

    it('should merge same providers to one entry', async () => {
      const fooEntries = attributions.filter((e) => e.provider === 'foo');
      expect(fooEntries).to.have.length(1);
    });

    it('should update url with value of latest entry of same provider', () => {
      const { url } = getDummyAttribution('foo', 2024);
      const fooEntries = attributions.filter((e) => e.provider === 'foo');
      expect(fooEntries[0]).to.have.property('url', url);
    });

    it('should sort and remove duplicates from years array returning a joined string', () => {
      const fooEntries = attributions.filter((e) => e.provider === 'foo');
      expect(fooEntries[0]).to.have.property(
        'years',
        [2022, 2023, 2024].join(', '),
      );
    });
  });
});
