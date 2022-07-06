import {
  describe,
  beforeAll,
  expect,
  it,
  vi,
} from 'vitest';
import { Feature } from 'ol';
import Point from 'ol/geom/Point.js';
import { OpenlayersMap, vcsLayerName, VectorLayer } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import TableFeatureInfoView from '../../../src/featureInfo/tableFeatureInfoView.js';
import { getDummyCenterWGS84, getDummyCesium3DTileFeature } from './getDummyCesium3DTileFeature.js';
import { sleep } from '../../helpers.js';

describe('FeatureInfo', () => {
  let app;
  let map;
  let featureInfo;
  let featureChangedSpy;

  beforeAll(async () => {
    app = new VcsUiApp();
    map = new OpenlayersMap({ name: 'ol' });
    app.maps.add(map);
    await app.maps.setActiveMap(map.name);
    // eslint-disable-next-line prefer-destructuring
    featureInfo = app.featureInfo;
  });

  describe('selecting a feature', () => {
    it('should derive position from ol.Feature, if no position provided', async () => {
      featureChangedSpy = vi.fn();
      featureInfo.featureChanged.addEventListener(featureChangedSpy);
      const feature = new Feature();
      feature.setGeometry(new Point([1, 1]));
      await featureInfo.selectFeature(feature, null, [0, 0]);
      await sleep();
      expect(featureChangedSpy).toHaveBeenCalledTimes(1);
      expect(featureChangedSpy).toHaveBeenLastCalledWith({ feature, position: [1, 1], windowPosition: [0, 0] });
    });

    it('should derive position from Cesium 3D Tile feature, if no position provided', async () => {
      featureChangedSpy = vi.fn();
      featureInfo.featureChanged.addEventListener(featureChangedSpy);
      // create a dummy Cesium3DTileFeature with boundingSphere
      const feature = getDummyCesium3DTileFeature();
      await featureInfo.selectFeature(feature, null, [0, 0]);
      await sleep();
      expect(featureChangedSpy).toHaveBeenCalledTimes(1);
      expect(featureChangedSpy).toHaveBeenLastCalledWith(
        { feature, position: getDummyCenterWGS84(), windowPosition: [0, 0] },
      );
    });

    it('should derive windowPosition, if not provided', async () => {
      vi.spyOn(map.olMap, 'getPixelFromCoordinate').mockImplementationOnce(() => [0, 0]);
      featureChangedSpy = vi.fn();
      featureInfo.featureChanged.addEventListener(featureChangedSpy);
      const feature = new Feature();
      feature.setGeometry(new Point([1, 1]));
      await featureInfo.selectFeature(feature, null, null);
      await sleep();
      expect(featureChangedSpy).toHaveBeenCalledTimes(1);
      expect(featureChangedSpy).toHaveBeenLastCalledWith({ feature, position: [1, 1], windowPosition: [0, 0] });
    });
  });

  describe('register View class', () => {
    it('add view class to feature info class registry', () => {
      featureInfo.classRegistry.registerClass('test', 'TestTable', TableFeatureInfoView);
      expect(featureInfo.classRegistry.hasClass('TestTable')).to.be.true;
    });
  });

  describe('activate featureInfo', () => {
    beforeAll(() => {
      featureInfo.activate();
    });

    it('should create a new session', () => {
      expect(featureInfo._session).to.be.not.null; // XXX other way except private property testing?
    });
    it('should set up listeners', () => {
      expect(featureInfo._listeners).to.have.length(7); // XXX other way except private property testing?
    });
    it('should set featureInfo button to active', () => {
      expect(app.toolboxManager.requestGroup('featureInfo').buttonManager
        .get('featureInfoTool').action.active).to.be.true;
    });
  });

  describe('deactivate featureInfo', () => {
    beforeAll(() => {
      featureInfo.deactivate();
    });

    it('should stop current session', () => {
      expect(featureInfo._session).to.be.null; // XXX other way except private property testing?
    });
    it('should remove listeners', () => {
      expect(featureInfo._listeners).to.have.length(0);
    });
    it('should close featureInfo window', () => {
      expect(app.windowManager.has('featureInfo')).to.be.false;
    });
    it('should clear highligthing', () => {
      expect(featureInfo._clearHighlightingCb).to.be.null;
    });
  });

  describe('handle feature clicked', () => {
    let feature;
    let layer;

    beforeAll(() => {
      featureInfo.collection.add(new TableFeatureInfoView({ name: 'testTable' }));
      feature = new Feature();
      feature.setId('testFeature');
      feature[vcsLayerName] = 'test';
      feature.setGeometry(new Point([1, 1]));
      layer = new VectorLayer({ name: 'test', properties: { featureInfo: 'testTable' } });
      layer.addFeatures([feature]);
      app.layers.add(layer);

      featureInfo.activate();
      featureInfo.selectFeature(feature, [1, 1], [0, 0]);
    });

    it('should add window of registered view class', () => {
      expect(app.windowManager.has(`featureInfo-${feature.getId()}`)).to.be.true;
    });
    it('should highlight selected feature', () => {
      expect(layer.featureVisibility.highlightedObjects).to.have.property(feature.getId());
    });
    it('should clear highlighting and close featureInfo window, if no feature is provided', () => {
      featureInfo.selectFeature(null);
      expect(app.windowManager.has(`featureInfo-${feature.getId()}`)).to.be.false;
      expect(layer.featureVisibility.highlightedObjects).not.to.have.property(feature.getId());
    });
  });
});
