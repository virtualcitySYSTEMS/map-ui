import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';
import {
  OpenlayersMap,
  Layer,
  VectorLayer,
  OpenStreetMapLayer,
  VcsEvent,
  Projection,
  Viewpoint,
  ObliqueMap,
  VectorStyleItem,
} from '@vcmap/core';
import { getObliqueCollection } from '@vcmap/core/dist/tests/unit/helpers/obliqueHelpers.js';
import { getCenter } from 'ol/extent.js';
import Feature from 'ol/Feature.js';
import VcsUiApp from '../../src/vcsUiApp.js';
import OverviewMap from '../../src/navigation/overviewMap.js';
import { sleep } from '../helpers.js';

describe('OverviewMap', () => {
  let app;
  let map;
  let obliqueMap;

  beforeAll(async () => {
    app = new VcsUiApp();
    map = new OpenlayersMap({ name: 'ol' });
    obliqueMap = new ObliqueMap({ name: 'oblique' });
    app.maps.add(map);
    app.maps.add(obliqueMap);
    await app.maps.setActiveMap(map.name);
  });

  afterAll(() => {
    app.destroy();
  });

  describe('activating the overview map with a non oblique map', () => {
    let overviewMap;

    beforeAll(async () => {
      overviewMap = new OverviewMap(app);
      app.layers.add(
        new OpenStreetMapLayer({
          name: 'Openstreetmap OSM Cache',
          properties: { showInOverviewMap: true },
        }),
      );
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should create an openlayers map', () => {
      expect(overviewMap.map).to.be.an.instanceof(OpenlayersMap);
    });

    it('should add base and cameraIcon layer and activate both', () => {
      expect([...overviewMap.map.layerCollection]).to.have.lengthOf(2);
      expect(
        [...overviewMap.map.layerCollection].some(
          (l) => l instanceof VectorLayer,
        ),
      ).to.be.true;
      expect(
        [...overviewMap.map.layerCollection].some((l) => l instanceof Layer),
      ).to.be.true;
      expect([...overviewMap.map.layerCollection].every((l) => l.active)).to.be
        .true;
    });

    it('should activate the map', () => {
      expect(overviewMap.map.active).to.be.true;
    });

    it('should add a mapClicked event', async () => {
      expect(overviewMap.mapClicked).to.be.an.instanceof(VcsEvent);
      const mapClickedSpy = vi.fn();
      overviewMap.mapClicked.addEventListener(mapClickedSpy);
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerdown',
        originalEvent: {
          preventDefault() {},
        },
        coordinate: [1, 1],
        pixel: [1, 1],
        preventDefault() {},
      });
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerup',
        originalEvent: {
          preventDefault() {},
        },
        coordinate: [1, 1],
        pixel: [1, 1],
        preventDefault() {},
      });

      await sleep();
      expect(mapClickedSpy).toHaveBeenCalledTimes(1);
    });

    it('should add the camera feature with the initial VP', () => {
      const features = overviewMap._cameraIconLayer.getFeatures();
      expect(features).to.have.lengthOf(1);
    });

    it('should have the cameraIconStyle', () => {
      const cameraFeature = overviewMap._cameraIconLayer.getFeatures()[0];
      expect(cameraFeature.getStyle()).to.equal(
        overviewMap.cameraIconStyle.style,
      );
    });
  });

  describe('navigating for a non oblique map', () => {
    let overviewMap;

    beforeAll(async () => {
      overviewMap = new OverviewMap(app);
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should go to the openlayers maps viewpoint, if clicked', async () => {
      const coordinate = Projection.wgs84ToMercator([13, 52]);
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerdown',
        originalEvent: {
          preventDefault() {},
        },
        coordinate,
        pixel: [1, 1],
        preventDefault() {},
      });
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerup',
        originalEvent: {
          preventDefault() {},
        },
        coordinate,
        pixel: [1, 1],
        preventDefault() {},
      });

      await sleep();
      const vp = map.getViewpointSync();
      expect(vp.groundPosition[0]).to.be.closeTo(13, 0.00000001);
      expect(vp.groundPosition[1]).to.be.closeTo(52, 0.00000001);
    });

    it('should synchronize the overview map to the openlayers map', async () => {
      await map.gotoViewpoint(
        new Viewpoint({
          groundPosition: [13, 52, 0],
          distance: 100,
        }),
      );
      map.olMap.renderSync();
      const vp = overviewMap.map.getViewpointSync();
      expect(vp.groundPosition[0]).to.be.closeTo(13, 0.00000001);
      expect(vp.groundPosition[1]).to.be.closeTo(52, 0.00000001);
    });

    it('should update the camera feature when synchronizing', async () => {
      const coordinate = Projection.wgs84ToMercator([13, 52]);
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerdown',
        originalEvent: {
          preventDefault() {},
        },
        coordinate,
        pixel: [1, 1],
        preventDefault() {},
      });
      overviewMap.map.olMap.dispatchEvent({
        type: 'pointerup',
        originalEvent: {
          preventDefault() {},
        },
        coordinate,
        pixel: [1, 1],
        preventDefault() {},
      });
      await sleep();
      const cameraFeature = overviewMap._cameraIconLayer.getFeatures()[0];
      const coords = Projection.mercatorToWgs84(
        cameraFeature.getGeometry().getCoordinates(),
      );
      expect(coords[0]).to.be.closeTo(13, 0.00001);
      expect(coords[1]).to.be.closeTo(52, 0.00001);
    });

    it('should not synchronize to the same viewpoint twice', async () => {
      const initialVp = overviewMap.map.getViewpointSync();
      const newVp = new Viewpoint({
        groundPosition: [13, 52, 0],
        distance: 100,
      });

      await map.gotoViewpoint(newVp);
      map.olMap.renderSync();
      await overviewMap.map.gotoViewpoint(initialVp);
      overviewMap.map.olMap.renderSync();
      await map.gotoViewpoint(newVp);
      map.olMap.renderSync();
      const vp = overviewMap.map.getViewpointSync();
      expect(vp.groundPosition[0]).to.be.closeTo(
        initialVp.groundPosition[0],
        0.00000001,
      );
      expect(vp.groundPosition[1]).to.be.closeTo(
        initialVp.groundPosition[1],
        0.00000001,
      );
    });

    it('should stop synchronizing a map, once its deactivated', async () => {
      const initialVp = overviewMap.map.getViewpointSync();
      const newVp = new Viewpoint({
        groundPosition: [13, 52, 0],
        distance: 100,
      });

      await app.maps.setActiveMap(obliqueMap.name);
      await map.gotoViewpoint(newVp);
      map.olMap.renderSync();
      const vp = overviewMap.map.getViewpointSync();
      expect(vp.groundPosition[0]).to.be.closeTo(
        initialVp.groundPosition[0],
        0.00000001,
      );
      expect(vp.groundPosition[1]).to.be.closeTo(
        initialVp.groundPosition[1],
        0.00000001,
      );
      await app.maps.setActiveMap(map.name);
    });
  });

  describe('activating the overview map with an oblique map', () => {
    let overviewMap;

    beforeAll(async () => {
      await app.maps.setActiveMap(obliqueMap.name);
      overviewMap = new OverviewMap(app);
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should setup and activate oblique layers', () => {
      expect(overviewMap.obliqueSelectedStyle).to.be.an.instanceof(
        VectorStyleItem,
      );
      expect(overviewMap._obliqueTileLayer).to.be.an.instanceof(VectorLayer);
      expect(overviewMap._obliqueImageLayer).to.be.an.instanceof(VectorLayer);
      expect(overviewMap._obliqueSelectedImageLayer).to.be.an.instanceof(
        VectorLayer,
      );
      expect(
        overviewMap.map.layerCollection.hasKey(
          overviewMap._obliqueTileLayer.name,
        ),
      ).to.be.true;
      expect(
        overviewMap.map.layerCollection.hasKey(
          overviewMap._obliqueImageLayer.name,
        ),
      ).to.be.true;
      expect(
        overviewMap.map.layerCollection.hasKey(
          overviewMap._obliqueSelectedImageLayer.name,
        ),
      ).to.be.true;
      expect(overviewMap._obliqueTileLayer.active).to.be.true;
      expect(overviewMap._obliqueImageLayer.active).to.be.true;
      expect(overviewMap._obliqueSelectedImageLayer.active).to.be.true;
    });
  });

  describe('navigating for an oblique map', () => {
    let overviewMap;

    beforeAll(async () => {
      await app.maps.setActiveMap(obliqueMap.name);
      overviewMap = new OverviewMap(app);
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should set the image name, if the feature is an image feature', () => {
      const feature = new Feature();
      feature.setId('test');
      const setImageOnMap = vi.spyOn(obliqueMap, 'setImageByName');
      overviewMap.mapClicked.raiseEvent({
        feature,
      });
      expect(setImageOnMap).toHaveBeenCalledWith(feature.getId());
    });

    it('should load an image from a tile, if a tile feature is clicked', async () => {
      const feature = new Feature();
      feature.setId('test');
      obliqueMap.collection.tileFeatureSource.addFeature(feature);
      obliqueMap.collection.imageFeatureSource.addFeature(feature);
      const setImageOnMap = vi.spyOn(obliqueMap, 'setImageByName');
      overviewMap.mapClicked.raiseEvent({
        feature,
      });
      expect(setImageOnMap).toHaveBeenCalledTimes(1);
      expect(setImageOnMap).toHaveBeenCalledWith('test');
    });
  });

  describe('handling of oblique images changing', () => {
    let overviewMap;

    beforeAll(async () => {
      await app.maps.setActiveMap(obliqueMap.name);
      overviewMap = new OverviewMap(app);
      await obliqueMap.initialize();
      obliqueMap.setCollection(await getObliqueCollection());
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    beforeEach(async () => {
      await obliqueMap.setImageByName('036_064_116005331');
    });

    it('should set the current feature on the oblique selected image layer', async () => {
      await obliqueMap.setImageByName('034_070_110005034');
      expect(
        overviewMap._obliqueSelectedImageLayer.getFeatures(),
      ).to.have.lengthOf(1);
      expect(
        overviewMap._obliqueSelectedImageLayer.getFeatureById(
          '034_070_110005034',
        ),
      ).to.be.not.null;
    });

    it('should zoom to the new images extent', async () => {
      const gotoViewpointSpy = vi.spyOn(overviewMap.map, 'gotoViewpoint');
      await obliqueMap.setImageByName('034_070_110005034');
      expect(gotoViewpointSpy).toHaveBeenCalledTimes(1);
      const [vp] = gotoViewpointSpy.mock.calls[0];
      const center = Projection.mercatorToWgs84(
        getCenter(
          obliqueMap.collection.imageFeatureSource
            .getFeatureById('034_070_110005034')
            .getGeometry()
            .getExtent(),
        ),
      );
      expect(vp.groundPosition[0]).to.be.closeTo(center[0], 0.000001);
      expect(vp.groundPosition[1]).to.be.closeTo(center[1], 0.000001);
    });
  });

  describe('switching from oblique to non-oblique', () => {
    let overviewMap;

    beforeAll(async () => {
      await app.maps.setActiveMap(obliqueMap.name);
      overviewMap = new OverviewMap(app);
      await overviewMap.activate();
      await app.maps.setActiveMap(map.name);
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should not longer listen to overview map clicked events', () => {
      vi.spyOn(map, 'gotoViewpoint');
      const feature = new Feature();
      feature.setId('test');
      const setImageOnMap = vi.spyOn(obliqueMap, 'setImageByName');
      overviewMap.mapClicked.raiseEvent({
        feature,
        positionOrPixel: [1, 1, 0],
      });
      expect(setImageOnMap).toHaveBeenCalledTimes(0);
    });

    it('should deactivate oblique layers', () => {
      expect(overviewMap._obliqueTileLayer.active).to.be.false;
      expect(overviewMap._obliqueImageLayer.active).to.be.false;
      expect(overviewMap._obliqueSelectedImageLayer.active).to.be.false;
    });

    it('should activate the vector layer', () => {
      expect(overviewMap._cameraIconLayer.active).to.be.true;
    });

    it('should no longer listen to image changes', async () => {
      const currentImageName = obliqueMap.currentImage.name;
      await obliqueMap.setImageByName('034_070_110005034');
      expect(overviewMap._obliqueSelectedImageLayer.getFeatures()).to.be.empty;
      await obliqueMap.setImageByName(currentImageName);
    });
  });

  describe('deactivating the overview map', () => {
    let overviewMap;

    beforeAll(async () => {
      overviewMap = new OverviewMap(app);
      await overviewMap.activate();
    });

    afterAll(() => {
      overviewMap.destroy();
    });

    it('should remove all listeners', () => {
      overviewMap.deactivate();
      expect(overviewMap._listeners).to.be.empty;
      expect(overviewMap._mapActivatedListener).to.be.null;
    });
  });

  describe('handling uiConfig options', () => {
    let overviewMap;
    let activeOnStartup;
    let hideMapNavigation;

    beforeAll(async () => {
      overviewMap = new OverviewMap(app);
      activeOnStartup = { name: 'overviewMapActiveOnStartup', value: true };
      hideMapNavigation = { name: 'hideMapNavigation', value: true };
    });

    beforeEach(async () => {
      await overviewMap.deactivate();
      app.uiConfig.removeModule('test');
      app.uiConfig.removeModule('test2');
      await sleep();
    });

    describe('active on startup', () => {
      it('should activate overview map on startup', async () => {
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems([activeOnStartup], 'test');
        await sleep();
        expect(overviewMap.active).to.be.true;
      });

      it('should not activate overview map on startup, if map navigation is hidden', async () => {
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems(
          [activeOnStartup, hideMapNavigation],
          'test',
        );
        await sleep();
        expect(overviewMap.active).to.be.false;
      });

      it('should not activate overview map on startup, if map navigation is already hidden by another module', async () => {
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems([hideMapNavigation], 'test');
        await sleep();
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems([activeOnStartup], 'test2');
        await sleep();
        expect(overviewMap.active).to.be.false;
      });
    });

    describe('hide map navigation', () => {
      it('should deactivate overview map, if map navigation is hidden', async () => {
        await overviewMap.activate();
        expect(overviewMap.active).to.be.true;
        await app.uiConfig.parseItems([hideMapNavigation], 'test');
        await sleep();
        expect(overviewMap.active).to.be.false;
      });

      it('should not activate overview map on startup, if map navigation is hidden', async () => {
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems(
          [
            { name: 'hideMapNavigation', value: true },
            { name: 'overviewMapActiveOnStartup', value: true },
          ],
          'test',
        );
        await sleep();
        expect(overviewMap.active).to.be.false;
      });

      it('should deactivate overview map, if map navigation is hidden by another module', async () => {
        expect(overviewMap.active).to.be.false;
        await app.uiConfig.parseItems([activeOnStartup], 'test');
        await sleep();
        expect(overviewMap.active).to.be.true;
        await app.uiConfig.parseItems([hideMapNavigation], 'test2');
        await sleep();
        expect(overviewMap.active).to.be.false;
      });
    });
  });
});
