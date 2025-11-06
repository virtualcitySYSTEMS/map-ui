import { describe, it, expect, beforeAll } from 'vitest';
import { setDefaultProjectionOptions, Viewpoint, WMSLayer } from '@vcmap/core';
import {
  createEmptyState,
  getStateFromURL,
  parseUrlExtentState,
  parseUrlProjectedViewpointState,
  parseWMSStyle,
  setStateToUrl,
  writeWMSStyleForLayer,
} from '../../src/state.js';

describe('URL state IO', () => {
  describe('normal state', () => {
    let originalState;
    let recreatedState;

    beforeAll(() => {
      originalState = createEmptyState();
      originalState.moduleIds.push('foo');
      originalState.plugins.push({ name: 'foo', state: [] });
      originalState.plugins.push({ name: 'bar', state: [] });

      originalState.layers.push({ name: 'foo', active: true });
      originalState.layers.push({ name: 'bar', active: false });
      originalState.layers.push({
        name: 'baz',
        active: true,
        styleName: 'foo',
      });

      originalState.clippingPolygons.push({ name: 'foo', active: true });
      originalState.clippingPolygons.push({ name: 'bar', active: false });

      originalState.activeObliqueCollection = 'foo';
      originalState.activeMap = 'bar';
      originalState.activeViewpoint = {
        cameraPosition: [1, 1, 2],
        groundPosition: [1, 1, 0],
        distance: 2,
      };
      const url = new URL('http://localhost');
      setStateToUrl(originalState, url);
      recreatedState = getStateFromURL(url);
    });

    it('should recreate moduleIds', () => {
      expect(recreatedState.moduleIds).to.deep.eql(originalState.moduleIds);
    });

    it('should recreate plugins', () => {
      expect(recreatedState.plugins).to.deep.eql(originalState.plugins);
    });

    it('should recreate layers', () => {
      expect(recreatedState.layers).to.deep.eql(originalState.layers);
    });

    it('should recreate activeObliqueCollection', () => {
      expect(recreatedState.activeObliqueCollection).to.equal(
        originalState.activeObliqueCollection,
      );
    });

    it('should recreate clipping polygons', () => {
      expect(recreatedState.clippingPolygons).to.deep.eql(
        originalState.clippingPolygons,
      );
    });

    it('should recreate activeMap', () => {
      expect(recreatedState.activeMap).to.equal(originalState.activeMap);
    });

    it('should recreate activeViewpoint', () => {
      expect(
        new Viewpoint(recreatedState.activeViewpoint).equals(
          new Viewpoint(originalState.activeViewpoint),
        ),
      ).to.be.true;
    });
  });

  describe('too large states for a URL', () => {
    describe('if a plugin is too large', () => {
      let originalState;
      let recreatedState;

      beforeAll(() => {
        originalState = createEmptyState();
        originalState.moduleIds.push('foo');
        originalState.plugins.push({ name: 'foo', state: [] });
        originalState.plugins.push({
          name: 'bar',
          state: new Array(2048).fill('X').join(''),
        });
        originalState.plugins.push({ name: 'baz', state: [] });

        originalState.layers.push({ name: 'foo', active: true });
        originalState.layers.push({ name: 'bar', active: false });
        originalState.layers.push({
          name: 'baz',
          active: true,
          styleName: 'foo',
        });

        originalState.clippingPolygons.push({ name: 'foo', active: true });
        originalState.clippingPolygons.push({ name: 'bar', active: false });

        originalState.activeObliqueCollection = 'foo';
        originalState.activeMap = 'bar';
        originalState.activeViewpoint = {
          cameraPosition: [1, 1, 2],
          groundPosition: [1, 1, 0],
          distance: 2,
        };
        const url = new URL('http://localhost');
        setStateToUrl(originalState, url);
        recreatedState = getStateFromURL(url);
      });

      it('should recreate moduleIds', () => {
        expect(recreatedState.moduleIds).to.deep.eql(originalState.moduleIds);
      });

      it('should recreate all plugins which could fit', () => {
        expect(recreatedState.plugins).to.deep.eql([
          originalState.plugins[0],
          originalState.plugins[2],
        ]);
      });

      it('should recreate layers', () => {
        expect(recreatedState.layers).to.deep.eql(originalState.layers);
      });

      it('should recreate clipping polygons', () => {
        expect(recreatedState.clippingPolygons).to.deep.eql(
          originalState.clippingPolygons,
        );
      });

      it('should recreate activeObliqueCollection', () => {
        expect(recreatedState.activeObliqueCollection).to.equal(
          originalState.activeObliqueCollection,
        );
      });

      it('should recreate activeMap', () => {
        expect(recreatedState.activeMap).to.equal(originalState.activeMap);
      });

      it('should recreate activeViewpoint', () => {
        expect(
          new Viewpoint(recreatedState.activeViewpoint).equals(
            new Viewpoint(originalState.activeViewpoint),
          ),
        ).to.be.true;
      });
    });

    describe('if a layer is too large', () => {
      let originalState;
      let recreatedState;

      beforeAll(() => {
        originalState = createEmptyState();
        originalState.moduleIds.push('foo');
        originalState.plugins.push({ name: 'foo', state: [] });
        originalState.plugins.push({ name: 'bar', state: [] });

        originalState.layers.push({ name: 'foo', active: true });
        originalState.layers.push({
          name: 'bar',
          active: true,
          styleName: new Array(2048).fill('X').join(''),
        });
        originalState.layers.push({
          name: 'baz',
          active: true,
          styleName: 'foo',
        });

        originalState.clippingPolygons.push({ name: 'foo', active: true });
        originalState.clippingPolygons.push({ name: 'bar', active: false });

        originalState.activeObliqueCollection = 'foo';
        originalState.activeMap = 'bar';
        originalState.activeViewpoint = {
          cameraPosition: [1, 1, 2],
          groundPosition: [1, 1, 0],
          distance: 2,
        };
        const url = new URL('http://localhost');
        setStateToUrl(originalState, url);
        recreatedState = getStateFromURL(url);
      });

      it('should recreate moduleIds', () => {
        expect(recreatedState.moduleIds).to.deep.eql(originalState.moduleIds);
      });

      it('should recreate all plugins which could fit', () => {
        expect(recreatedState.plugins).to.deep.eql(originalState.plugins);
      });

      it('should recreate layers', () => {
        expect(recreatedState.layers).to.deep.eql([
          originalState.layers[0],
          originalState.layers[2],
        ]);
      });

      it('should recreate clipping polygons', () => {
        expect(recreatedState.clippingPolygons).to.deep.eql(
          originalState.clippingPolygons,
        );
      });

      it('should recreate activeObliqueCollection', () => {
        expect(recreatedState.activeObliqueCollection).to.equal(
          originalState.activeObliqueCollection,
        );
      });

      it('should recreate activeMap', () => {
        expect(recreatedState.activeMap).to.equal(originalState.activeMap);
      });

      it('should recreate activeViewpoint', () => {
        expect(
          new Viewpoint(recreatedState.activeViewpoint).equals(
            new Viewpoint(originalState.activeViewpoint),
          ),
        ).to.be.true;
      });
    });
  });

  describe('parseUrlExtentState', () => {
    it('should return a viewpoint options object when given a valid UrlExtentState', () => {
      // const state = [[11.444, 51.444, 11.445, 51.445], 4326];
      const state = [
        [1483489.844959, 6874471.152533, 1519996.177132, 6919844.170657],
        3857,
      ];

      setDefaultProjectionOptions({
        epsg: 3857,
        proj4:
          '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
      });

      const result = parseUrlExtentState(state);
      expect(result.distance).to.equal(98382.58847444993);
      expect(result.groundPosition).to.deep.eql([
        13.490386996418437, 52.53325788629458,
      ]);
    });
  });

  describe('parseUrlViewpointState', () => {
    it('should return a viewpoint options object in EPSG:4326 when given a valid UrlViewpointState in EPSG:3857', () => {
      const state = [
        [1483489.844959, 6874471.152533, 100],
        [1483489.844959, 6874471.152533, 0],
        1000,
        0,
        -45,
        0,
        3857, // projection Code
      ];

      const expectedViewpoint = {
        cameraPosition: [13.326416015627688, 52.40928880894867, 100],
        groundPosition: [13.326416015627688, 52.40928880894867, 0],
        distance: 1000,
      };

      setDefaultProjectionOptions({
        epsg: 3857,
        proj4:
          '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
      });

      const result = parseUrlProjectedViewpointState(state);

      expect(result.cameraPosition).to.deep.eql(
        expectedViewpoint.cameraPosition,
      );
      expect(result.groundPosition).to.deep.eql(
        expectedViewpoint.groundPosition,
      );
      expect(result.distance).to.equal(expectedViewpoint.distance);
    });
  });

  describe('handling of WMS layers', () => {
    let layerConfig;
    let layer;
    let layerWithOnlyStyle;
    let layerWithOnlyLayers;

    beforeAll(() => {
      layerConfig = {
        name: 'wmsLayer',
        layers: 'foo,bar',
        parameters: {
          styles: 'foo,baz',
        },
      };
      layer = new WMSLayer(layerConfig);
      layerWithOnlyStyle = new WMSLayer({
        name: 'wmsLayerWithOnlyStyle',
        parameters: {
          styles: 'foo,baz',
        },
      });
      layerWithOnlyLayers = new WMSLayer({
        name: 'wmsLayerWithOnlyLayers',
        layers: 'foo,bar',
      });
    });

    describe('writing a WMS layer state', () => {
      it('should write layers and styles for WMS layers with both', () => {
        const layerState = writeWMSStyleForLayer(layer, {});
        expect(layerState).to.equal('7;foo,barfoo,baz');
      });

      it('should not write a style, if the layers config already has these styles', () => {
        const layerState = writeWMSStyleForLayer(layer, {
          layers: [layerConfig],
        });
        expect(layerState).to.be.undefined;
      });

      it('should write only styles for WMS layers with only styles', () => {
        const layerState = writeWMSStyleForLayer(layerWithOnlyStyle, {
          layers: [],
        });
        expect(layerState).to.equal('0;foo,baz');
      });

      it('should write only layers for WMS layers with only layers', () => {
        const layerState = writeWMSStyleForLayer(layerWithOnlyLayers, {
          layers: [],
        });
        expect(layerState).to.equal('7;foo,bar');
      });
    });

    describe('parsing WMS styles', () => {
      it('should parse layers and styles from a WMS layer state', () => {
        const layerState = writeWMSStyleForLayer(layer, {});
        const parsedState = parseWMSStyle(layerState);
        expect(parsedState.layers).to.equal('foo,bar');
        expect(parsedState.styles).to.equal('foo,baz');
      });

      it('should parse only styles from a WMS layer state with only styles', () => {
        const layerState = writeWMSStyleForLayer(layerWithOnlyStyle, {});
        const parsedState = parseWMSStyle(layerState);
        expect(parsedState.layers).to.be.empty;
        expect(parsedState.styles).to.equal('foo,baz');
      });

      it('should parse only layers from a WMS layer state with only layers', () => {
        const layerState = writeWMSStyleForLayer(layerWithOnlyLayers, {});
        const parsedState = parseWMSStyle(layerState);
        expect(parsedState.layers).to.equal('foo,bar');
        expect(parsedState.styles).to.be.empty;
      });
    });
  });
});
