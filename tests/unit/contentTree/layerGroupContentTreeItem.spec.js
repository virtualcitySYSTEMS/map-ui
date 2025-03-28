import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import { ObliqueMap, OpenlayersMap, VectorLayer } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import LayerGroupContentTreeItem from '../../../src/contentTree/layerGroupContentTreeItem.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';

describe('LayerGroupContentTreeItem', () => {
  describe('if no layers are present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new LayerGroupContentTreeItem(
        { name: 'foo', layerNames: ['foo'] },
        app,
      );
      expect(item.visible).to.be.false;
      app.destroy();
      item.destroy();
    });
  });

  describe('if layers are present', () => {
    let app;
    let item;
    let itemToShowWhenNotSupported;
    let layers;

    beforeEach(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      app.maps.add(new ObliqueMap({ name: 'obl' }));
      await app.maps.setActiveMap('ol');
      layers = [
        { mapNames: ['ol'], properties: { availableStyles: ['foo', 'bar'] } },
        { mapNames: ['ol'] },
        { mapNames: ['bar'] },
      ].map((config) => new VectorLayer(config));

      layers.forEach((l) => {
        app.layers.add(l);
      });
      item = new LayerGroupContentTreeItem(
        {
          name: 'foo',
          layerNames: layers.map((l) => l.name),
          defaultViewpoint: 'foo',
          availableStyles: ['foo'],
        },
        app,
      );
      itemToShowWhenNotSupported = new LayerGroupContentTreeItem(
        {
          name: 'bar',
          layerNames: layers.map((l) => l.name),
          showWhenNotSupported: true,
        },
        app,
      );
    });

    afterEach(() => {
      item.destroy();
      app.destroy();
    });

    describe('visibility', () => {
      it('should be visible if a single layer is supported', () => {
        expect(item.visible).to.be.true;
      });

      it('should not be visible, if all layers are not supported', async () => {
        await app.maps.setActiveMap('obl');
        expect(item.visible).to.be.false;
      });

      it('should not be visible if removing all supported layers', () => {
        app.layers.remove(layers[0]);
        app.layers.remove(layers[1]);
        expect(item.visible).to.be.false;
      });

      describe('showWhenNotSupported flag', () => {
        it('should be visible but disabled, if all layers are not supported', async () => {
          await app.maps.setActiveMap('obl');
          expect(itemToShowWhenNotSupported.visible).to.be.true;
          expect(itemToShowWhenNotSupported.disabled).to.be.true;
        });

        it('should only change disabled state if flag is set', async () => {
          await app.maps.setActiveMap('obl');
          expect(item.visible).to.be.false;
          expect(item.disabled).to.be.false;
        });
      });
    });

    describe('state', () => {
      it('should be active, if all layers are active', async () => {
        await Promise.all(layers.map((l) => l.activate()));
        expect(item.state).to.equal(StateActionState.ACTIVE);
      });

      it('should be inactive, if all layers are inactive', () => {
        layers.map((l) => l.deactivate());
        expect(item.state).to.equal(StateActionState.INACTIVE);
      });

      it('should be loading, if one layer is loading', async () => {
        const [layer] = layers;
        layer.activate();
        expect(item.state).to.equal(StateActionState.LOADING);
        await layer.activate();
      });

      it('should be indeterminate, if states are both inactive & active', async () => {
        const [layer] = layers;
        await layer.activate();
        expect(item.state).to.equal(StateActionState.INDETERMINATE);
      });

      it('should not listen to removed layer state changes', async () => {
        const [layer] = layers;
        app.layers.remove(layer);
        await layer.activate();
        expect(item.state).to.equal(StateActionState.INACTIVE);
      });
    });

    describe('click behavior', () => {
      it('should activate all inactive layers, if all layers inactive', async () => {
        await item.clicked();
        expect(layers.filter((l) => l.active)).to.have.members(layers);
      });

      it('should activate all inactive layers, if some layers are active', async () => {
        const [layer1] = layers;
        await layer1.activate();
        await item.clicked();
        expect(layers.filter((l) => l.active)).to.have.members(layers);
      });

      it('should activate all inactive layers, if some layers are loading', async () => {
        const [layer1] = layers;
        layer1.activate();
        await item.clicked();
        expect(layers.filter((l) => l.active)).to.have.members(layers);
      });

      it('should deactivate all layers, if all layers are active', async () => {
        await Promise.all(layers.map((l) => l.activate()));
        await item.clicked();
        expect(layers.filter((l) => l.active)).to.be.empty;
      });
    });

    describe('actions', () => {
      it('should add a viewpoint action', () => {
        expect(item.actions.some((a) => a.name === 'ViewpointAction')).to.be
          .true;
      });

      it('should add a style action', () => {
        expect(item.actions.some((a) => a.name === 'StyleSelector')).to.be.true;
      });
    });
  });

  describe('serialization', () => {
    let app;

    beforeAll(() => {
      app = new VcsUiApp();
    });

    afterAll(() => {
      app.destroy();
    });

    describe('minimal config', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          layerNames: ['foo'],
        };

        const item = new LayerGroupContentTreeItem(inputConfig, app);
        outputConfig = item.toJSON();
        item.destroy();
      });

      it('should only configure type, name and layerNames', () => {
        expect(outputConfig).to.have.all.keys(['name', 'type', 'layerNames']);
      });

      it('should configure layerNames', () => {
        expect(outputConfig)
          .to.have.property('layerNames')
          .and.to.eql(inputConfig.layerNames);
        expect(outputConfig)
          .to.have.property('layerNames')
          .and.to.not.equal(inputConfig.layerNames);
      });
    });

    describe('full config', () => {
      let inputConfig;
      let outputConfig;

      beforeAll(() => {
        inputConfig = {
          name: 'foo',
          layerNames: ['foo'],
          defaultViewpoint: 'foo',
        };

        const item = new LayerGroupContentTreeItem(inputConfig, app);
        outputConfig = item.toJSON();
        item.destroy();
      });

      it('should configure defaultViewpoint', () => {
        expect(outputConfig).to.have.property(
          'defaultViewpoint',
          outputConfig.defaultViewpoint,
        );
      });
    });
  });
});
