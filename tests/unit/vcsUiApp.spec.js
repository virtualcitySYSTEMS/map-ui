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
  VcsModule,
  moduleIdSymbol,
  markVolatile,
  OpenlayersMap,
  VectorLayer,
  VectorStyleItem,
  Viewpoint,
  ClippingPolygonObject,
  LayerState,
  WMSLayer,
} from '@vcmap/core';
import { setObliqueMap } from '@vcmap/core/dist/tests/unit/helpers/obliqueHelpers.js';
import VcsUiApp from '../../src/vcsUiApp.js';
import { pluginModuleUrlSymbol } from '../../src/pluginHelper.js';

/**
 * @param {VcsUiApp} app
 * @returns {Viewpoint}
 */
async function setupApp(app) {
  const module = new VcsModule({ _id: 'foo' });
  await app.addModule(module);
  await app.setDynamicModule(module);

  const activeClippingPolygon = new ClippingPolygonObject({
    name: 'activeClippingPolygon',
    coordinates: [
      [0, 0],
      [1, 1],
      [1, 0],
    ],
    activeOnStartup: false,
  });
  await activeClippingPolygon.activate();
  app.clippingPolygons.add(activeClippingPolygon);

  const inactiveClippingPolygon = new ClippingPolygonObject({
    name: 'inactiveClippingPolygon',
    coordinates: [
      [0, 0],
      [1, 1],
      [1, 0],
    ],
    activeOnStartup: false,
  });
  app.clippingPolygons.add(inactiveClippingPolygon);

  const activeLayer = new VectorLayer({
    name: 'activeLayer',
    activeOnStartup: false,
  });
  await activeLayer.activate();
  app.layers.add(activeLayer);

  const volatileActiveLayer = new VectorLayer({
    name: 'volatileActiveLayer',
    activeOnStartup: false,
  });
  await volatileActiveLayer.activate();
  markVolatile(volatileActiveLayer);
  app.layers.add(volatileActiveLayer);

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
  const wmsLayer = new WMSLayer({
    name: 'wmsLayer',
    layers: 'foo,bar',
    parameters: {
      STYLES: 'foo,baz',
    },
  });
  wmsLayer._state = LayerState.ACTIVE;
  app.layers.add(wmsLayer);

  const unsupportedLayer = new VectorLayer({
    name: 'unsupportedLayer',
    mapNames: ['foo'],
  });
  await unsupportedLayer.activate();
  app.layers.add(unsupportedLayer);

  await app.resetDynamicModule();
  const dynamicModuleLayer = new VectorLayer({
    name: 'dynamicModuleLayer',
  });
  await dynamicModuleLayer.activate();
  app.layers.add(dynamicModuleLayer);

  const dynamicModuleStyle = new VectorStyleItem({
    name: 'dynamicModuleStyle',
  });
  app.styles.add(dynamicModuleStyle);

  const pluginInDefaultModule = {
    name: 'pluginInDefaultModule',
    getState() {
      return 'foo';
    },
  };
  pluginInDefaultModule[pluginModuleUrlSymbol] = 'http://localhost/_test';
  app.plugins.add(pluginInDefaultModule);
  await app.setDynamicModule(module);

  const volatileStyle = new VectorStyleItem({
    name: 'volatileStyle',
  });
  markVolatile(volatileStyle);
  app.styles.add(volatileStyle);

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

  const layerStyledByDefaultDynamicModule = new VectorLayer({
    name: 'layerStyledByDefaultDynamicModule',
  });
  await layerStyledByDefaultDynamicModule.activate();
  layerStyledByDefaultDynamicModule.setStyle(dynamicModuleStyle);
  app.layers.add(layerStyledByDefaultDynamicModule);

  const layerStyledByVolatileStyle = new VectorLayer({
    name: 'layerStyledByVolatileStyle',
  });
  await layerStyledByVolatileStyle.activate();
  layerStyledByDefaultDynamicModule.setStyle(volatileStyle);
  app.layers.add(layerStyledByVolatileStyle);

  const pluginWithGetState = {
    name: 'pluginWithGetState',
    getState() {
      return 'foo';
    },
  };
  pluginWithGetState[pluginModuleUrlSymbol] = 'http://localhost/_test';
  app.plugins.add(pluginWithGetState);

  const volatilePlugin = {
    name: 'volatilePlugin',
    getState() {
      return 'foo';
    },
  };
  volatilePlugin[pluginModuleUrlSymbol] = 'http://localhost/_test';
  markVolatile(volatilePlugin);
  app.plugins.add(volatilePlugin);

  const pluginWithAsyncGetState = {
    name: 'pluginWithAsyncGetState',
    getState() {
      return Promise.resolve('bar');
    },
  };
  pluginWithAsyncGetState[pluginModuleUrlSymbol] = 'http://localhost/_test';
  app.plugins.add(pluginWithAsyncGetState);

  const pluginWithoutGetState = {
    name: 'pluginWithoutGetState',
  };
  pluginWithoutGetState[pluginModuleUrlSymbol] = 'http://localhost/_test';
  app.plugins.add(pluginWithoutGetState);

  const pluginWithEmptyState = {
    name: 'pluginWithEmptyState',
  };
  pluginWithEmptyState[pluginModuleUrlSymbol] = 'http://localhost/_test';
  app.plugins.add(pluginWithEmptyState);

  const activeMap = new OpenlayersMap({ name: 'activeMap' });
  app.maps.add(activeMap);
  await app.maps.setActiveMap(activeMap.name);

  const activeViewpoint = new Viewpoint({
    groundPosition: [1, 1],
    distance: 2,
  });
  await app.maps.activeMap.gotoViewpoint(activeViewpoint);
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
          expect(state.layers).to.deep.include({
            name: 'activeLayer',
            active: true,
          });
        });

        it('should add inactive active on startup layers', () => {
          expect(state.layers).to.deep.include({
            name: 'deactivatedActiveOnStartupLayer',
            active: false,
          });
        });

        it('should add the style for styled layers, if the layer is active', () => {
          expect(state.layers).to.deep.include({
            name: 'styledActiveLayer',
            active: true,
            styleName: 'style',
          });
        });

        it('should not add active active on startup layers', () => {
          expect(
            state.layers.find((s) => s.name === 'activeActiveOnStartupLayer'),
          ).to.be.undefined;
        });

        it('should not add unsupported layers', () => {
          expect(state.layers.find((s) => s.name === 'unsupportedLayer')).to.be
            .undefined;
        });

        it('should not add layers which are part of the dynamic module', () => {
          expect(state.layers.find((s) => s.name === 'dynamicModuleLayer')).to
            .be.undefined;
        });

        it('should not add layers which are volatile', () => {
          expect(state.layers.find((s) => s.name === 'volatileActiveLayer')).to
            .be.undefined;
        });

        it('should not add styled inactive layers', () => {
          expect(state.layers.find((s) => s.name === 'styledInactiveLayer')).to
            .be.undefined;
        });

        it('should not add the style name to layers, if the style is part of the dynamic module', () => {
          expect(state.layers).to.deep.include({
            name: 'layerStyledByDefaultDynamicModule',
            active: true,
          });
        });

        it('should not add the style name to layers, if the style is volatile', () => {
          expect(state.layers).to.deep.include({
            name: 'layerStyledByVolatileStyle',
            active: true,
          });
        });

        it('should encode WMS layers and styles correctly', () => {
          expect(state.layers).to.deep.include({
            name: 'wmsLayer',
            active: true,
            styleName: '7;foo,barfoo,baz',
          });
        });
      });

      describe('clipping polygon handling', () => {
        it('should add active clipping polygons', () => {
          expect(state.clippingPolygons).to.deep.include({
            name: 'activeClippingPolygon',
            active: true,
          });
        });

        it('should not add inactive clipping polygons', () => {
          expect(
            state.clippingPolygons.find(
              (s) => s.name === 'inactiveClippingPolygon',
            ),
          ).to.be.undefined;
        });
      });

      describe('plugin handling', () => {
        it('should add plugins with a getState function', () => {
          expect(state.plugins).to.deep.include({
            name: 'pluginWithGetState',
            state: 'foo',
          });
        });

        it('should add a pugin with an async getState function', () => {
          expect(state.plugins).to.deep.include({
            name: 'pluginWithAsyncGetState',
            state: 'bar',
          });
        });

        it('should not add plugins without a getState function', () => {
          expect(state.plugins.find((s) => s.name === 'pluginWithoutGetState'))
            .to.be.undefined;
        });

        it('should not add plugins with empty state object', () => {
          expect(state.plugins.find((s) => s.name === 'pluginWithEmptyState'))
            .to.be.undefined;
        });

        it('should not add plugins in the default dynamic module', () => {
          expect(state.plugins.find((s) => s.name === 'pluginInDefaultModule'))
            .to.be.undefined;
        });

        it('should not add plugins which are volatile', () => {
          expect(state.plugins.find((s) => s.name === 'volatilePlugin')).to.be
            .undefined;
        });
      });

      it('should set the active map name', () => {
        expect(state.activeMap).to.equal('activeMap');
      });

      it('should set the active viewpoint', () => {
        expect(new Viewpoint(state.activeViewpoint).equals(viewpoint)).to.be
          .true;
      });

      it('should add modules', () => {
        expect([...state.moduleIds]).to.have.members(['foo']);
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

  describe('loading module', () => {
    describe('loading a module, which has a state', () => {
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
        config = originalApp.serializeModule('foo');
        state = await originalApp.getState();
        originalApp.destroy();
        app = new VcsUiApp();
        app._cachedAppState = state;
        await app.addModule(new VcsModule(config));
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

      it('should activate the states active clipping polygon', () => {
        expect(app.clippingPolygons.hasKey('activeClippingPolygon')).to.be.true;
        const polygon = app.clippingPolygons.getByKey('activeClippingPolygon');
        expect(polygon.active || polygon.loading).to.be.true;
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
        const vp = await app.maps.activeMap.getViewpoint();
        expect(vp.equals(originalViewpoint)).to.be.true;
      });
    });

    describe('loading of a module twice, which has a state', () => {
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
        config = originalApp.serializeModule('foo');
        state = await originalApp.getState();
        originalApp.destroy();
        app = new VcsUiApp();
        app._cachedAppState = state;
        await app.addModule(new VcsModule(config));
        await app.removeModule('foo');
        const newMap = new OpenlayersMap({});
        app.maps.add(newMap);
        await app.maps.setActiveMap(newMap.name);
        await app.addModule(new VcsModule(config));
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
        const vp = await app.maps.activeMap.getViewpoint();
        expect(vp.equals(originalViewpoint)).to.be.true;
      });
    });

    describe('loading plugins with a state', () => {
      let app;

      beforeEach(() => {
        app = new VcsUiApp();
        app._cachedAppState = {
          moduleIds: ['foo'],
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

      it('should set the state in initialize, if the plugin has a state and is part of the moduleIds of the state', () => {
        const spy = vi.fn();
        const plugin = {
          name: 'foo',
          initialize(_, state) {
            spy(state);
          },
        };
        plugin[moduleIdSymbol] = 'foo';
        app.plugins.add(plugin);
        expect(spy).toHaveBeenCalledWith('foo');
      });

      it('should not set the state in initialize, if the plugin has a state and is not part of the moduleIds of the state', () => {
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
