import {
  describe,
  it,
  expect,
  beforeAll,
} from 'vitest';
import { ViewPoint } from '@vcmap/core';
import { createEmptyState, getStateFromURL, setStateToUrl } from '../../src/state.js';

describe('URL state IO', () => {
  describe('normal state', () => {
    let originalState;
    let recreatedState;

    beforeAll(() => {
      originalState = createEmptyState();
      originalState.contextIds.push('foo');
      originalState.plugins.push({ name: 'foo', state: [] });
      originalState.plugins.push({ name: 'bar', state: [] });

      originalState.layers.push({ name: 'foo', active: true });
      originalState.layers.push({ name: 'bar', active: false });
      originalState.layers.push({ name: 'baz', active: true, styleName: 'foo' });

      originalState.activeObliqueCollection = 'foo';
      originalState.activeMap = 'bar';
      originalState.activeViewpoint = new ViewPoint({
        cameraPosition: [1, 1, 2],
        groundPosition: [1, 1, 0],
        distance: 2,
      });
      const url = new URL('http://localhost');
      setStateToUrl(originalState, url);
      recreatedState = getStateFromURL(url);
    });

    it('should recreate contextIds', () => {
      expect(recreatedState.contextIds).to.deep.eql(originalState.contextIds);
    });

    it('should recreate plugins', () => {
      expect(recreatedState.plugins).to.deep.eql(originalState.plugins);
    });

    it('should recreate layers', () => {
      expect(recreatedState.layers).to.deep.eql(originalState.layers);
    });

    it('should recreate activeObliqueCollection', () => {
      expect(recreatedState.activeObliqueCollection).to.equal(originalState.activeObliqueCollection);
    });

    it('should recreate activeMap', () => {
      expect(recreatedState.activeMap).to.equal(originalState.activeMap);
    });

    it('should recreate activeViewpoint', () => {
      expect(new ViewPoint(recreatedState.activeViewpoint).equals(new ViewPoint(originalState.activeViewpoint)))
        .to.be.true;
    });
  });

  describe('too large states for a URL', () => {
    describe('if a plugin is too large', () => {
      let originalState;
      let recreatedState;

      beforeAll(() => {
        originalState = createEmptyState();
        originalState.contextIds.push('foo');
        originalState.plugins.push({ name: 'foo', state: [] });
        originalState.plugins.push({ name: 'bar', state: new Array(2048).fill('X').join('') });
        originalState.plugins.push({ name: 'baz', state: [] });

        originalState.layers.push({ name: 'foo', active: true });
        originalState.layers.push({ name: 'bar', active: false });
        originalState.layers.push({ name: 'baz', active: true, styleName: 'foo' });

        originalState.activeObliqueCollection = 'foo';
        originalState.activeMap = 'bar';
        originalState.activeViewpoint = new ViewPoint({
          cameraPosition: [1, 1, 2],
          groundPosition: [1, 1, 0],
          distance: 2,
        });
        const url = new URL('http://localhost');
        setStateToUrl(originalState, url);
        recreatedState = getStateFromURL(url);
      });

      it('should recreate contextIds', () => {
        expect(recreatedState.contextIds).to.deep.eql(originalState.contextIds);
      });

      it('should recreate all plugins which could fit', () => {
        expect(recreatedState.plugins).to.deep.eql([originalState.plugins[0], originalState.plugins[2]]);
      });

      it('should recreate layers', () => {
        expect(recreatedState.layers).to.deep.eql(originalState.layers);
      });

      it('should recreate activeObliqueCollection', () => {
        expect(recreatedState.activeObliqueCollection).to.equal(originalState.activeObliqueCollection);
      });

      it('should recreate activeMap', () => {
        expect(recreatedState.activeMap).to.equal(originalState.activeMap);
      });

      it('should recreate activeViewpoint', () => {
        expect(new ViewPoint(recreatedState.activeViewpoint).equals(new ViewPoint(originalState.activeViewpoint)))
          .to.be.true;
      });
    });

    describe('if a layer is too large', () => {
      let originalState;
      let recreatedState;

      beforeAll(() => {
        originalState = createEmptyState();
        originalState.contextIds.push('foo');
        originalState.plugins.push({ name: 'foo', state: [] });
        originalState.plugins.push({ name: 'bar', state: [] });

        originalState.layers.push({ name: 'foo', active: true });
        originalState.layers.push({ name: 'bar', active: true, styleName: new Array(2048).fill('X').join('') });
        originalState.layers.push({ name: 'baz', active: true, styleName: 'foo' });

        originalState.activeObliqueCollection = 'foo';
        originalState.activeMap = 'bar';
        originalState.activeViewpoint = new ViewPoint({
          cameraPosition: [1, 1, 2],
          groundPosition: [1, 1, 0],
          distance: 2,
        });
        const url = new URL('http://localhost');
        setStateToUrl(originalState, url);
        recreatedState = getStateFromURL(url);
      });

      it('should recreate contextIds', () => {
        expect(recreatedState.contextIds).to.deep.eql(originalState.contextIds);
      });

      it('should recreate all plugins which could fit', () => {
        expect(recreatedState.plugins).to.deep.eql(originalState.plugins);
      });

      it('should recreate layers', () => {
        expect(recreatedState.layers).to.deep.eql([originalState.layers[0], originalState.layers[2]]);
      });

      it('should recreate activeObliqueCollection', () => {
        expect(recreatedState.activeObliqueCollection).to.equal(originalState.activeObliqueCollection);
      });

      it('should recreate activeMap', () => {
        expect(recreatedState.activeMap).to.equal(originalState.activeMap);
      });

      it('should recreate activeViewpoint', () => {
        expect(new ViewPoint(recreatedState.activeViewpoint).equals(new ViewPoint(originalState.activeViewpoint)))
          .to.be.true;
      });
    });
  });
});
