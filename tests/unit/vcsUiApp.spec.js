import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import {
  Context,
  contextIdSymbol,
  OpenlayersMap,
  VectorLayer,
  VectorStyleItem,
  ViewPoint,
} from '@vcmap/core';
import { setObliqueMap } from '@vcmap/core/tests/unit/helpers/obliqueHelpers.js';
import VcsUiApp from '../../src/vcsUiApp.js';

/**
 * @param {VcsUiApp} app
 * @returns {ViewPoint}
 */
async function setupApp(app) {
  const context = new Context({ id: 'foo' });
  await app.addContext(context);
  await app.setDynamicContext(context);

  const activeLayer = new VectorLayer({
    name: 'activeLayer',
    activeOnStartup: false,
  });
  await activeLayer.activate();
  app.layers.add(activeLayer);

  const activeActiveOnStartupLayer = new VectorLayer({
    name: 'activeActiveOnStartupLayer',
    activeOnStartup: true,
  });
  await activeActiveOnStartupLayer.activate();
  app.layers.add(activeActiveOnStartupLayer);

  const deactivatedActiveOnStartupLayer = new VectorLayer({
    name: 'deactivatedActiveOnStartupLayer',
    activeOnStartup: true,
  });
  app.layers.add(deactivatedActiveOnStartupLayer);

  const unsupportedLayer = new VectorLayer({
    name: 'unsupportedLayer',
    mapNames: ['foo'],
  });
  await unsupportedLayer.activate();
  app.layers.add(unsupportedLayer);

  await app.resetDynamicContext();
  const dynamicContextLayer = new VectorLayer({
    name: 'dynamicContextLayer',
  });
  await dynamicContextLayer.activate();
  app.layers.add(dynamicContextLayer);

  const dynamicContextStyle = new VectorStyleItem({
    name: 'dynamicContextStyle',
  });
  app.styles.add(dynamicContextStyle);

  const pluginInDefaultContext = {
    name: 'pluginInDefaultContext',
    getState() { return 'foo'; },
  };
  app.plugins.add(pluginInDefaultContext);
  await app.setDynamicContext(context);

  const style = new VectorStyleItem({
    name: 'style',
  });
  app.styles.add(style);

  const styledActiveLayer = new VectorLayer({
    name: 'styledActiveLayer',
  });
  await styledActiveLayer.activate();
  styledActiveLayer.setStyle(style);
  app.layers.add(styledActiveLayer);

  const styledInactiveLayer = new VectorLayer({
    name: 'styledInactiveLayer',
  });
  styledInactiveLayer.setStyle(style);
  app.layers.add(styledInactiveLayer);

  const layerStyledByDefaultDynamicContext = new VectorLayer({
    name: 'layerStyledByDefaultDynamicContext',
  });
  await layerStyledByDefaultDynamicContext.activate();
  layerStyledByDefaultDynamicContext.setStyle(dynamicContextStyle);
  app.layers.add(layerStyledByDefaultDynamicContext);

  const pluginWithGetState = {
    name: 'pluginWithGetState',
    getState() { return 'foo'; },
  };
  app.plugins.add(pluginWithGetState);

  const pluginWithAsyncGetState = {
    name: 'pluginWithAsyncGetState',
    getState() { return Promise.resolve('bar'); },
  };
  app.plugins.add(pluginWithAsyncGetState);

  const pluginWithoutGetState = {
    name: 'pluginWithoutGetState',
  };
  app.plugins.add(pluginWithoutGetState);

  const activeMap = new OpenlayersMap({ name: 'activeMap' });
  app.maps.add(activeMap);
  await app.maps.setActiveMap(activeMap.name);

  const activeViewpoint = new ViewPoint({
    groundPosition: [1, 1],
    distance: 2,
  });
  await app.maps.activeMap.gotoViewPoint(activeViewpoint);
  return activeViewpoint;
}

describe('VcsUiApp', () => {
  describe('state handling (for URL)', () => {
    describe('with an active non-oblique map', () => {
      let app;
      /** @type {AppState} */
      let state;
      let viewpoint;

      beforeAll(async () => {
        app = new VcsUiApp();
        viewpoint = await setupApp(app);
        state = await app.getState(true);
      });

      afterAll(() => {
        app.destroy();
      });

      describe('layer handling', () => {
        it('should add active layers, which are not active on startup', () => {
          expect(state.layers).to.deep.include({ name: 'activeLayer', active: true });
        });

        it('should add inactive active on startup layers', () => {
          expect(state.layers).to.deep.include({ name: 'deactivatedActiveOnStartupLayer', active: false });
        });

        it('should add the style for styled layers, if the layer is active', () => {
          expect(state.layers).to.deep
            .include({ name: 'styledActiveLayer', active: true, styleName: 'style' });
        });

        it('should not add active active on startup layers', () => {
          expect(state.layers.find(s => s.name === 'activeActiveOnStartupLayer')).to.be.undefined;
        });

        it('should not add unsupported layers', () => {
          expect(state.layers.find(s => s.name === 'unsupportedLayer')).to.be.undefined;
        });

        it('should not add layers which are part of the dynamic context', () => {
          expect(state.layers.find(s => s.name === 'dynamicContextLayer')).to.be.undefined;
        });

        it('should not add styled inactive layers', () => {
          expect(state.layers.find(s => s.name === 'styledInactiveLayer')).to.be.undefined;
        });

        it('should not add the style name to layers, if the style is part of the dynamic context', () => {
          expect(state.layers).to.deep
            .include({ name: 'layerStyledByDefaultDynamicContext', active: true });
        });
      });

      describe('plugin handling', () => {
        it('should add plugins with a getState function', () => {
          expect(state.plugins).to.deep.include({ name: 'pluginWithGetState', state: 'foo' });
        });

        it('should add a pugin with an async getState function', () => {
          expect(state.plugins).to.deep.include({ name: 'pluginWithAsyncGetState', state: 'bar' });
        });

        it('should not add plugins without a getState function', () => {
          expect(state.plugins.find(s => s.name === 'pluginWithoutGetState')).to.be.undefined;
        });

        it('should not add plugins in the default dynamic context', () => {
          expect(state.plugins.find(s => s.name === 'pluginInDefaultContext')).to.be.undefined;
        });
      });

      it('should set the active map name', () => {
        expect(state.activeMap).to.equal('activeMap');
      });

      it('should set the active viewpoint', () => {
        expect(new ViewPoint(state.activeViewpoint).equals(viewpoint)).to.be.true;
      });

      it('should add contexts', () => {
        expect([...state.contextIds]).to.have.members(['foo']);
      });
    });

    describe('with an active oblique map', () => {
      let app;
      /** @type {AppState} */
      let state;

      beforeAll(async () => {
        app = new VcsUiApp();
        await setObliqueMap(app);
        state = await app.getState(true);
      });

      afterAll(() => {
        app.destroy();
      });

      it('should set the activeObliqueCollection', () => {
        expect(state.activeObliqueCollection).to.equal('obliqueCollection');
      });
    });
  });

  describe('loading context', () => {
    describe('loading a context, which has a state', () => {
      /**
       * @type {VcsUiApp}
       */
      let app;
      let state;
      let config;
      let originalViewpoint;

      beforeAll(async () => {
        const originalApp = new VcsUiApp();
        originalViewpoint = await setupApp(originalApp);
        config = {
          id: 'foo',
          maps: originalApp.maps.serializeContext('foo'),
          layers: originalApp.layers.serializeContext('foo'),
          styles: originalApp.styles.serializeContext('foo'),
        };
        state = await originalApp.getState();
        originalApp.destroy();
        app = new VcsUiApp();
        app._cachedAppState = state;
        await app.addContext(new Context(config));
      });

      afterAll(() => {
        app.destroy();
      });

      it('should apply the states active map', () => {
        expect(app.maps.activeMap).to.exist;
        expect(app.maps.activeMap.name).to.equal('activeMap');
      });

      it('should activate the states active layer', () => {
        expect(app.layers.hasKey('activeLayer')).to.be.true;
        const layer = app.layers.getByKey('activeLayer');
        expect(layer.active || layer.loading).to.be.true;
      });

      it('should deactivate the states deactivated active on startup layers', () => {
        expect(app.layers.hasKey('deactivatedActiveOnStartupLayer')).to.be.true;
        const layer = app.layers.getByKey('deactivatedActiveOnStartupLayer');
        expect(layer.active || layer.loading).to.be.false;
      });

      it('should set the states layer with styles', () => {
        expect(app.layers.hasKey('styledActiveLayer')).to.be.true;
        expect(app.styles.hasKey('style')).to.be.true;
        const layer = app.layers.getByKey('styledActiveLayer');
        expect(layer.style).to.equal(app.styles.getByKey('style'));
      });

      it('should set the states viewpoint', async () => {
        const vp = await app.maps.activeMap.getViewPoint();
        expect(vp.equals(originalViewpoint)).to.be.true;
      });
    });

    describe('loading of a context twice, which has a state', () => {
      /**
       * @type {VcsUiApp}
       */
      let app;
      let state;
      let config;
      let originalViewpoint;

      beforeAll(async () => {
        const originalApp = new VcsUiApp();
        originalViewpoint = await setupApp(originalApp);
        config = {
          id: 'foo',
          maps: originalApp.maps.serializeContext('foo'),
          layers: originalApp.layers.serializeContext('foo'),
          styles: originalApp.styles.serializeContext('foo'),
        };
        state = await originalApp.getState();
        originalApp.destroy();
        app = new VcsUiApp();
        app._cachedAppState = state;
        await app.addContext(new Context(config));
        await app.removeContext('foo');
        const newMap = new OpenlayersMap({});
        app.maps.add(newMap);
        await app.maps.setActiveMap(newMap.name);
        await app.addContext(new Context(config));
      });

      afterAll(() => {
        app.destroy();
      });

      it('should not apply the states active map', () => {
        expect(app.maps.activeMap).to.be.exist;
        expect(app.maps.activeMap.name).to.not.equal('activeMap');
      });

      it('should not activate the states active layer', () => {
        expect(app.layers.hasKey('activeLayer')).to.be.true;
        const layer = app.layers.getByKey('activeLayer');
        expect(layer.active || layer.loading).to.be.false;
      });

      it('should not deactivate the states deactivated active on startup layers', () => {
        expect(app.layers.hasKey('deactivatedActiveOnStartupLayer')).to.be.true;
        const layer = app.layers.getByKey('deactivatedActiveOnStartupLayer');
        expect(layer.active || layer.loading).to.be.true;
      });

      it('should not set the states layer with styles', () => {
        expect(app.layers.hasKey('styledActiveLayer')).to.be.true;
        expect(app.styles.hasKey('style')).to.be.true;
        const layer = app.layers.getByKey('styledActiveLayer');
        expect(layer.style).to.equal(app.styles.getByKey('style'));
      });

      it('should set the states viewpoint', async () => {
        const vp = await app.maps.activeMap.getViewPoint();
        expect(vp.equals(originalViewpoint)).to.be.true;
      });
    });

    describe('loading plugins with a state', () => {
      let app;

      beforeEach(() => {
        app = new VcsUiApp();
        app._cachedAppState = {
          contextIds: ['foo'],
          layers: [],
          plugins: [
            {
              name: 'foo',
              state: 'foo',
            },
          ],
        };
      });

      afterEach(() => {
        app.destroy();
      });

      it('should set the state in initialize, if the plugin has a state and is part of the contextIds of the state', () => {
        const spy = vi.fn();
        const plugin = {
          name: 'foo',
          initialize(_, state) {
            spy(state);
          },
        };
        plugin[contextIdSymbol] = 'foo';
        app.plugins.add(plugin);
        expect(spy).toHaveBeenCalledWith('foo');
      });

      it('should not set the state in initialize, if the plugin has a state and is not part of the contextIds of the state', () => {
        const spy = vi.fn();
        const plugin = {
          name: 'foo',
          initialize(_, state) {
            spy(state);
          },
        };
        app.plugins.add(plugin);
        expect(spy).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
