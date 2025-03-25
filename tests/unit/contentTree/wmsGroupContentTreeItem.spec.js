import fs from 'fs';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import nock from 'nock';
import { watch } from 'vue';
import { WMSLayer } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import WMSGroupContentTreeItem from '../../../src/contentTree/wmsGroupContentTreeItem.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';
import { legendSymbol } from '../../../src/legend/legendHelper.js';

async function getWMSPoiXML() {
  const wmsPOIXML = await fs.promises.readFile('./tests/data/wms_poi_open.xml');
  return wmsPOIXML;
}

function awaitStateChange(state) {
  if (state.value === StateActionState.LOADING) {
    return new Promise((resolve) => {
      const watcher = watch(state, () => {
        if (state.value !== StateActionState.LOADING) {
          watcher();
          resolve();
        }
      });
    });
  }
  return Promise.resolve();
}

describe('WMSGroupContentTreeItem', async () => {
  let app;
  let scope;

  beforeAll(async () => {
    const wmsPOIXML = await getWMSPoiXML();
    scope = nock('http://sgx.geodatenzentrum.de')
      .persist()
      .get('/wms_poi_open?VERSION=1.1.1&SERVICE=WMS&REQUEST=GetCapabilities')
      .reply(200, wmsPOIXML, { 'Content-Type': 'application/xml' });
  });

  afterAll(() => {
    scope.done();
    nock.cleanAll();
  });

  describe('setup with already existing Layer', () => {
    let layer;
    let wmsGroupContentTreeItem;

    beforeAll(async () => {
      app = new VcsUiApp();
      layer = new WMSLayer({
        name: 'foo',
        url: 'http://sgx.geodatenzentrum.de/wms_poi_open',
        layers: 'flughaefen',
      });
      app.layers.add(layer);
      await layer.activate();
      wmsGroupContentTreeItem = new WMSGroupContentTreeItem(
        { name: 'test', layerName: 'foo' },
        app,
      );
      app.contentTree.add(wmsGroupContentTreeItem);
      // WMSGroupContentTreeItem calls async setup where we parse the Capabilities
      await awaitStateChange(wmsGroupContentTreeItem._state);
    });

    afterAll(() => {
      app.destroy();
    });

    it('should set the child', async () => {
      const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
      treeviewItem.children.forEach((child) => {
        if (child.name === 'test.flughaefen') {
          expect(child.state).to.equal(StateActionState.ACTIVE);
        } else {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        }
      });
    });

    it('should set the state on the item', () => {
      expect(wmsGroupContentTreeItem.state).to.equal(
        StateActionState.INDETERMINATE,
      );
    });

    describe('layer deactivated state changes', () => {
      beforeAll(() => {
        layer.deactivate();
      });

      afterAll(async () => {
        await layer.activate();
      });

      it('should set the state on the children', async () => {
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        treeviewItem.children.forEach((child) => {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        });
      });

      it('should set the state on the item, if the layer changes', async () => {
        expect(wmsGroupContentTreeItem.state).to.equal(
          StateActionState.INACTIVE,
        );
      });
    });

    describe('layer activated state changes', () => {
      beforeAll(async () => {
        layer.deactivate();
        layer.setLayers('grenzuebergaenge,haltestellen');
        layer.parameters.STYLES = 'grenzuebergaenge,haltestellen';
        await layer.activate();
      });

      it('should set the state on the children', async () => {
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        treeviewItem.children.forEach((child) => {
          if (
            child.name === 'test.grenzuebergaenge' ||
            child.name === 'test.haltestellen'
          ) {
            expect(child.state).to.equal(StateActionState.ACTIVE);
          } else {
            expect(child.state).to.equal(StateActionState.INACTIVE);
          }
        });
      });

      it('should set the state on the item, if the layer changes', async () => {
        expect(wmsGroupContentTreeItem.state).to.equal(
          StateActionState.INDETERMINATE,
        );
      });

      it('should set the activeStyles', async () => {
        wmsGroupContentTreeItem._availableWMSEntries.forEach((entry) => {
          if (entry.name === 'grenzuebergaenge') {
            expect(entry.activeStyle.value).to.equal('grenzuebergaenge');
          } else if (entry.name === 'haltestellen') {
            expect(entry.activeStyle.value).to.equal('haltestellen');
          } else {
            expect(entry.activeStyle.value).to.equal('');
          }
        });
      });
    });

    describe('layerState without active layers', () => {
      let halteStelle;
      let grenzuebergaenge;
      beforeAll(async () => {
        // deactivate halteStellen and Grenzuebergaenge
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        halteStelle = treeviewItem.children.find(
          (child) => child.name === 'test.haltestellen',
        );
        await halteStelle.clicked();
        grenzuebergaenge = treeviewItem.children.find(
          (child) => child.name === 'test.grenzuebergaenge',
        );
        await grenzuebergaenge.clicked();
      });

      it('should set the wmsLayers on the layer', () => {
        expect(layer.getLayers().length).to.be.equal(0);
      });
      it('should set the styles on the layer', () => {
        expect(layer.parameters.STYLES).to.equal('');
      });
      it('should set the legend on the layer', () => {
        expect(layer[legendSymbol]).to.be.undefined;
      });
      it('should set the layer state', () => {
        expect(layer.active).to.be.false;
      });
    });

    describe('layerState with active layers', () => {
      let halteStelle;
      let grenzuebergaenge;
      beforeAll(async () => {
        // deactivate halteStellen and Grenzuebergaenge
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        halteStelle = treeviewItem.children.find(
          (child) => child.name === 'test.haltestellen',
        );
        await halteStelle.clicked();
        grenzuebergaenge = treeviewItem.children.find(
          (child) => child.name === 'test.grenzuebergaenge',
        );
        await grenzuebergaenge.clicked();
      });

      it('should set the wmsLayers on the layer', () => {
        expect(layer.getLayers().length).to.be.equal(2);
      });
      it('should set the styles on the layer', () => {
        expect(layer.parameters.STYLES).to.equal(
          'grenzuebergaenge,haltestellen',
        );
      });
      it('should set the legend on the layer', () => {
        expect(layer[legendSymbol]).to.not.be.undefined;
      });
      it('should set the layer state', () => {
        expect(layer.active).to.be.true;
      });
    });
  });

  describe('setup with where the layer is added after the wmsItem', () => {
    let layer;
    let wmsGroupContentTreeItem;

    beforeAll(async () => {
      app = new VcsUiApp();
      layer = new WMSLayer({
        name: 'foo',
        url: 'http://sgx.geodatenzentrum.de/wms_poi_open',
        layers: 'flughaefen',
      });
      wmsGroupContentTreeItem = new WMSGroupContentTreeItem(
        { name: 'test', layerName: 'foo' },
        app,
      );
      app.contentTree.add(wmsGroupContentTreeItem);
      await layer.activate();
      app.layers.add(layer);
      // WMSGroupContentTreeItem calls async setup where we parse the Capabilities
      await awaitStateChange(wmsGroupContentTreeItem._state);
    });

    afterAll(() => {
      app.destroy();
    });

    it('should set the  the child', async () => {
      const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
      treeviewItem.children.forEach((child) => {
        if (child.name === 'test.flughaefen') {
          expect(child.state).to.equal(StateActionState.ACTIVE);
        } else {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        }
      });
    });

    it('should set the state on the item', () => {
      expect(wmsGroupContentTreeItem.state).to.equal(
        StateActionState.INDETERMINATE,
      );
    });

    describe('layer deactivated state changes', () => {
      beforeAll(() => {
        layer.deactivate();
      });

      afterAll(async () => {
        await layer.activate();
      });

      it('should set the state on the children', async () => {
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        treeviewItem.children.forEach((child) => {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        });
      });

      it('should set the state on the item, if the layer changes', async () => {
        expect(wmsGroupContentTreeItem.state).to.equal(
          StateActionState.INACTIVE,
        );
      });
    });

    describe('layer activated state changes', () => {
      beforeAll(async () => {
        layer.deactivate();
        layer.setLayers('grenzuebergaenge,haltestellen');
        layer.parameters.STYLES = 'grenzuebergaenge,haltestellen';
        await layer.activate();
      });

      it('should set the state on the children', async () => {
        const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
        treeviewItem.children.forEach((child) => {
          if (
            child.name === 'test.grenzuebergaenge' ||
            child.name === 'test.haltestellen'
          ) {
            expect(child.state).to.equal(StateActionState.ACTIVE);
          } else {
            expect(child.state).to.equal(StateActionState.INACTIVE);
          }
        });
      });

      it('should set the state on the item, if the layer changes', async () => {
        expect(wmsGroupContentTreeItem.state).to.equal(
          StateActionState.INDETERMINATE,
        );
      });

      it('should set the activeStyles', async () => {
        wmsGroupContentTreeItem._availableWMSEntries.forEach((entry) => {
          if (entry.name === 'grenzuebergaenge') {
            expect(entry.activeStyle.value).to.equal('grenzuebergaenge');
          } else if (entry.name === 'haltestellen') {
            expect(entry.activeStyle.value).to.equal('haltestellen');
          } else {
            expect(entry.activeStyle.value).to.equal('');
          }
        });
      });
    });
  });

  describe('setWMSLayersExclusive', () => {
    let layer;
    let wmsGroupContentTreeItem;

    beforeAll(async () => {
      app = new VcsUiApp();
      layer = new WMSLayer({
        name: 'foo',
        url: 'http://sgx.geodatenzentrum.de/wms_poi_open',
        layers: 'flughaefen,haltestellen',
      });
      app.layers.add(layer);
      await layer.activate();
      wmsGroupContentTreeItem = new WMSGroupContentTreeItem(
        { name: 'test', layerName: 'foo', setWMSLayersExclusive: true },
        app,
      );
      app.contentTree.add(wmsGroupContentTreeItem);
      // WMSGroupContentTreeItem calls async setup where we parse the Capabilities
      await awaitStateChange(wmsGroupContentTreeItem._state);
    });

    afterAll(() => {
      app.destroy();
    });

    it('should only set one child active', async () => {
      const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
      treeviewItem.children.forEach((child) => {
        if (child.name === 'test.flughaefen') {
          expect(child.state).to.equal(StateActionState.ACTIVE);
        } else {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        }
      });
    });

    it('should set the state on the item', () => {
      expect(wmsGroupContentTreeItem.state).to.equal(StateActionState.NONE);
    });

    it('activating another layer, should deactivate all other', async () => {
      const treeviewItem = wmsGroupContentTreeItem.getTreeViewItem();
      const halteStelle = treeviewItem.children.find(
        (child) => child.name === 'test.haltestellen',
      );
      await halteStelle.clicked();
      treeviewItem.children.forEach((child) => {
        if (child.name === 'test.haltestellen') {
          expect(child.state).to.equal(StateActionState.ACTIVE);
        } else {
          expect(child.state).to.equal(StateActionState.INACTIVE);
        }
      });
    });
  });
});
