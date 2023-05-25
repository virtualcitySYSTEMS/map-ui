import {
  DeclarativeStyleItem,
  ObliqueMap,
  OpenlayersMap,
  VectorLayer,
} from '@vcmap/core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import LayerContentTreeItem from '../../../src/contentTree/layerContentTreeItem.js';
import ApplyLayerStyleCallback from '../../../src/callback/applyLayerStyleCallback.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';
import { sleep } from '../../helpers.js';

describe('LayerContentTreeItem', () => {
  describe('if there is a layer', () => {
    let layer;
    let layerToDeactivate;
    let item;
    /** @type {VcsUiApp} */
    let app;

    beforeAll(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      app.maps.add(new ObliqueMap({ name: 'obl' }));
      await app.maps.setActiveMap('ol');
      layer = new VectorLayer({ mapNames: ['ol'] });
      layerToDeactivate = new VectorLayer({ name: 'layerToDeactivate' });
      app.layers.add(layer);
      app.layers.add(layerToDeactivate);
      item = new LayerContentTreeItem(
        {
          name: 'foo',
          layerName: layer.name,
        },
        app,
      );
    });

    afterAll(() => {
      app.destroy();
      item.destroy();
    });

    describe('handling map activation', () => {
      afterAll(async () => {
        await app.maps.setActiveMap('ol');
      });

      it('should not be visible if activating an unsuported map', async () => {
        await app.maps.setActiveMap('obl');
        expect(item.visible).to.be.false;
      });

      it('should be visible if the active map is supported', async () => {
        await app.maps.setActiveMap('ol');
        expect(item.visible).to.be.true;
      });

      it('should activate the layer on click', async () => {
        await app.maps.setActiveMap('ol');
        layer.deactivate();
        await item.clicked();
        expect(layer.active).to.be.true;
      });
    });

    describe('handling of layer state change', () => {
      beforeAll(async () => {
        await layer.activate();
      });

      afterAll(() => {
        layer.deactivate();
      });

      it('should set the state', () => {
        expect(item.state).to.equal(StateActionState.ACTIVE);
      });
    });

    describe('handle removing of the layer', () => {
      beforeAll(() => {
        app.layers.remove(layer);
      });

      afterAll(() => {
        app.layers.add(layer);
      });

      it('should no longer be visible', () => {
        expect(item.visible).to.be.false;
      });

      it('should no longer listen to state changes', async () => {
        await layer.activate();
        expect(item.state).to.equal(StateActionState.INACTIVE);
        layer.deactivate();
      });
    });
  });

  describe('layer property handling', () => {
    describe('if a layer has properties', () => {
      let item;
      /** @type {VcsUiApp} */
      let app;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.maps.add(new OpenlayersMap({ name: 'ol' }));
        app.maps.add(new ObliqueMap({ name: 'obl' }));
        await app.maps.setActiveMap('ol');
        const layer = new VectorLayer({
          mapNames: ['ol'],
          extent: {
            coordinate: [0, 0, 1, 1],
            projection: {
              epsg: 4326,
            },
          },
          properties: {
            availableStyles: ['foo'],
            defaultViewpoint: 'foo',
          },
        });
        app.layers.add(layer);
        item = new LayerContentTreeItem(
          { name: 'foo', layerName: layer.name },
          app,
        );
      });

      afterAll(() => {
        app.destroy();
        item.destroy();
      });

      it('should add a viewpoint action', () => {
        expect(item.actions.some((a) => a.name === 'ViewpointAction')).to.be
          .true;
      });

      it('should add an extent action', () => {
        expect(
          item.actions.some((a) => a.name === 'content.layerExtentAction.name'),
        ).to.be.true;
      });

      it('should add a style action', () => {
        expect(item.actions.some((a) => a.name === 'StyleSelector')).to.be.true;
      });
    });

    describe('if a layer is overriden with less properties', () => {
      let item;
      /** @type {VcsUiApp} */
      let app;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.maps.add(new OpenlayersMap({ name: 'ol' }));
        app.maps.add(new ObliqueMap({ name: 'obl' }));
        await app.maps.setActiveMap('ol');
        const layer = new VectorLayer({
          mapNames: ['ol'],
          extent: {
            coordinate: [0, 0, 1, 1],
            projection: {
              epsg: 4326,
            },
          },
          properties: {
            availableStyles: ['foo'],
            defaultViewpoint: 'foo',
          },
        });
        app.layers.add(layer);
        item = new LayerContentTreeItem(
          { name: 'foo', layerName: layer.name },
          app,
        );
        app.layers.override(new VectorLayer({ name: layer.name }));
      });

      afterAll(() => {
        app.destroy();
        item.destroy();
      });

      it('should not have a viewpoint action', () => {
        expect(item.actions.some((a) => a.name === 'ViewpointAction')).to.be
          .false;
      });

      it('should not have an extent action', () => {
        expect(item.actions.some((a) => a.name === 'LayerExtentAction')).to.be
          .false;
      });

      it('should not have a style action', () => {
        expect(item.actions.some((a) => a.name === 'StyleSelector')).to.be
          .false;
      });
    });
  });

  describe('if layer is not present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new LayerContentTreeItem(
        { name: 'foo', layerName: 'foo' },
        app,
      );
      expect(item.visible).to.be.false;
      item.destroy();
      app.destroy();
    });
  });

  describe('clicked', () => {
    let item;
    /** @type {VcsUiApp} */
    let app;
    let layer;
    let style;

    beforeAll(async () => {
      app = new VcsUiApp();
      layer = new VectorLayer({});
      style = new DeclarativeStyleItem({});
      app.layers.add(layer);
      app.styles.add(style);
      item = new LayerContentTreeItem(
        {
          name: 'foo',
          layerName: layer.name,
          onActivate: [
            {
              type: 'ApplyLayerStyleCallback',
              layerName: layer.name,
              styleName: style.name,
            },
          ],
          onDeactivate: [
            {
              type: 'DeaactivateLayersCallback',
              layerNames: ['layerToDeactivate'],
            },
          ],
        },
        app,
      );
      app.callbackClassRegistry.registerClass(
        app.dynamicModuleId,
        ApplyLayerStyleCallback.className,
        ApplyLayerStyleCallback,
      );
    });

    it('should execute all onActivate callbacks on activation', async () => {
      expect(item).to.have.property('state', StateActionState.INACTIVE);
      await item.clicked();
      await sleep(0);
      expect(item).to.have.property('state', StateActionState.ACTIVE);
      expect(layer.style).to.have.property('name', style.name);
    });

    it('should execute all onDeactivate callbacks on deactivation', async () => {
      const layerToDeactivate = new VectorLayer({});
      await layerToDeactivate.activate();
      app.layers.add(layer);
      expect(item).to.have.property('state', StateActionState.ACTIVE);
      expect(layer).to.have.property('active', true);
      await item.clicked();
      await sleep(0);
      expect(item).to.have.property('state', StateActionState.INACTIVE);
      expect(layer).to.have.property('active', false);
    });
  });

  describe('serialize', () => {
    it('should serialize name, type and layerName', () => {
      const app = new VcsUiApp();
      const item = new LayerContentTreeItem(
        { name: 'foo', layerName: 'foo' },
        app,
      );
      const config = item.toJSON();
      expect(config).to.have.all.keys(['name', 'type', 'layerName']);
      item.destroy();
      app.destroy();
    });
  });
});
