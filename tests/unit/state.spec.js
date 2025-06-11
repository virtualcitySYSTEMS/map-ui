import { describe, it, expect, beforeAll } from 'vitest';
import { setDefaultProjectionOptions, Viewpoint } from '@vcmap/core';
import {
  createEmptyState,
  getStateFromURL,
  parseUrlExtentState,
  parseUrlProjectedViewpointState,
  setStateToUrl,
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
});
