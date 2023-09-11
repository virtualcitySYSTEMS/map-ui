import {
  EventType,
  ModificationKeyType,
  OpenlayersMap,
  PointerKeyType,
  VectorLayer,
} from '@vcmap/core';
import { Cartesian2 } from '@vcmap-cesium/engine';
import { Feature } from 'ol';
import {
  describe,
  it,
  beforeAll,
  afterAll,
  vi,
  expect,
  beforeEach,
  afterEach,
} from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { contextMenuWindowId } from '../../../src/manager/contextMenu/ContextMenuComponent.vue';

async function setupAppForEvents(app) {
  const map = new OpenlayersMap({});
  app.maps.add(map);
  await app.maps.setActiveMap(map.name);
  const target = document.createElement('div');
  document.body.append(target);
  app.maps.setTarget(target);

  const getBaseEvent = () => ({
    windowPosition: new Cartesian2(0, 0),
    key: ModificationKeyType.NONE,
    map,
    type: EventType.CLICK,
  });

  return {
    raiseRightClick(feature) {
      return app.contextMenuManager._interaction.pipe({
        pointer: PointerKeyType.RIGHT,
        feature,
        ...getBaseEvent(),
      });
    },
    raiseLeftClick() {
      return app.contextMenuManager._interaction.pipe({
        feature: new Feature(),
        pointer: PointerKeyType.LEFT,
        ...getBaseEvent(),
      });
    },
    raiseMiddleClick() {
      return app.contextMenuManager._interaction.pipe({
        feature: new Feature(),
        pointer: PointerKeyType.MIDDLE,
        ...getBaseEvent(),
      });
    },
    destroy() {
      document.body.removeChild(target);
    },
  };
}

describe('ContextMenuManager', () => {
  describe('listening interactions', () => {
    /** @type {ContextMenuManager} */
    let contextMenuManager;
    let app;
    let raiseRightClick;
    let raiseLeftClick;
    let raiseMiddleClick;
    let destroy;

    beforeEach(async () => {
      app = new VcsUiApp();
      ({ contextMenuManager } = app);
      contextMenuManager.addEventHandler(({ feature }) => {
        if (feature) {
          return [
            {
              name: 'foo',
              callback() {},
            },
          ];
        }
        return [];
      }, 'foo');
      ({ raiseRightClick, raiseLeftClick, raiseMiddleClick, destroy } =
        await setupAppForEvents(app));
    });

    afterEach(() => {
      app.destroy();
      destroy();
    });

    it('should setup a window on right click, if there are actions', async () => {
      await raiseRightClick(new Feature());
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
    });

    it('should ignore invalid actions', async () => {
      contextMenuManager.addEventHandler(() => [{ foo: true }], 'foo');
      await raiseRightClick();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });

    it('should remove the window, if raised without any actions', async () => {
      await raiseRightClick(new Feature());
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      await raiseRightClick();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });

    it('should remove the window on left click', async () => {
      await raiseRightClick(new Feature());
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      await raiseLeftClick();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });

    it('should remove the window on middle click', async () => {
      await raiseRightClick(new Feature());
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      await raiseMiddleClick();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });
  });

  describe('closing of the menu', () => {
    let app;
    let destroy;
    let raiseRightClick;

    beforeEach(async () => {
      app = new VcsUiApp();
      app.contextMenuManager.addEventHandler(
        () => [
          {
            name: 'foo',
            callback() {},
          },
        ],
        'foo',
      );

      ({ raiseRightClick, destroy } = await setupAppForEvents(app));
      await raiseRightClick();
    });

    afterEach(() => {
      app.destroy();
      destroy();
    });

    it('should close the window, if the maps viewpoint changes', async () => {
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      const { activeMap } = app.maps;
      const vp = activeMap.getViewpointSync();
      vp.groundPosition[0] += 1;
      await activeMap.gotoViewpoint(vp);
      activeMap.olMap.renderSync();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });

    it('should close, if a layers state changes', async () => {
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      const layer = new VectorLayer({});
      app.layers.add(layer);
      await layer.activate();
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });

    it('should close when activating another map', async () => {
      expect(app.windowManager.has(contextMenuWindowId)).to.be.true;
      const map = new OpenlayersMap({});
      app.maps.add(map);
      await app.maps.setActiveMap(map.name);
      expect(app.windowManager.has(contextMenuWindowId)).to.be.false;
    });
  });

  describe('adding/removing event handlers', () => {
    /** @type {ContextMenuManager} */
    let contextMenuManager;
    let app;
    let raiseRightClick;
    let destroy;

    beforeAll(async () => {
      app = new VcsUiApp();
      ({ contextMenuManager } = app);
      ({ raiseRightClick, destroy } = await setupAppForEvents(app));
    });

    afterAll(() => {
      app.destroy();
      destroy();
    });

    it('should allow the adding of a handler', async () => {
      const spy = vi.fn(() => []);
      contextMenuManager.addEventHandler(spy, 'foo');
      await raiseRightClick();
      expect(spy).toHaveBeenCalled();
    });

    it('should allow the removal of a handler', async () => {
      const spy = vi.fn(() => []);
      contextMenuManager.addEventHandler(spy, 'foo');
      contextMenuManager.removeHandler(spy);
      await raiseRightClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should allow the removal of an owner', async () => {
      const spy = vi.fn(() => []);
      contextMenuManager.addEventHandler(spy, 'bar');
      contextMenuManager.removeOwner('bar');
      await raiseRightClick();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should sort actions in order of their owners', async () => {
      app.plugins.add({ name: 'foo' });
      app.plugins.add({ name: 'bar' });

      let validation = '';
      contextMenuManager.addEventHandler(() => {
        validation += 'bar';
      }, 'bar');
      contextMenuManager.addEventHandler(() => {
        validation += 'foo';
      }, 'foo');
      await raiseRightClick();
      expect(validation).to.equal('foobar');
    });
  });
});
