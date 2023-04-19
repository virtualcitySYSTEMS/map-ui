import {
  DefaultObliqueCollection,
  ObliqueMap,
  OpenlayersMap,
} from '@vcmap/core';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import VcsUiApp from '../../../src/vcsUiApp.js';
import ObliqueCollectionContentTreeItem from '../../../src/contentTree/obliqueCollectionContentTreeItem.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';

describe('ObliqueCollectionContentTreeItem', () => {
  describe('if there is a collection', () => {
    let collection;
    let otherCollection;
    let item;
    /** @type {VcsUiApp} */
    let app;
    let map;

    beforeAll(async () => {
      app = new VcsUiApp();
      app.maps.add(new OpenlayersMap({ name: 'ol' }));
      map = new ObliqueMap({ name: 'obl' });
      app.maps.add(map);
      await app.maps.setActiveMap('obl');
      collection = new DefaultObliqueCollection({});
      otherCollection = new DefaultObliqueCollection({});
      app.obliqueCollections.add(collection);
      app.obliqueCollections.add(otherCollection);
      await map.setCollection(otherCollection);
      item = new ObliqueCollectionContentTreeItem(
        { name: 'foo', collectionName: collection.name },
        app,
      );
    });

    afterAll(() => {
      app.destroy();
      item.destroy();
    });

    describe('handling map activation', () => {
      afterAll(async () => {
        await app.maps.setActiveMap('obl');
      });

      it('should not be visible if the activated map is not an oblique map', async () => {
        await app.maps.setActiveMap('ol');
        expect(item.visible).to.be.false;
      });

      it('should be visible if the active map is supported', async () => {
        await app.maps.setActiveMap('obl');
        expect(item.visible).to.be.true;
      });
    });

    describe('handling of oblique collection change', () => {
      beforeAll(async () => {
        await map.setCollection(collection);
      });

      afterAll(async () => {
        await map.setCollection(otherCollection);
      });

      it('should set the state', () => {
        expect(item.state).to.equal(StateActionState.ACTIVE);
      });
    });

    describe('handle removing of the layer', () => {
      beforeAll(() => {
        app.obliqueCollections.remove(collection);
      });

      afterAll(() => {
        app.obliqueCollections.add(collection);
      });

      it('should no longer be visible', () => {
        expect(item.visible).to.be.false;
      });

      it('should no longer listen to state changes', async () => {
        await map.setCollection(collection);
        expect(item.state).to.equal(StateActionState.INACTIVE);
        await map.setCollection(otherCollection);
      });
    });
  });

  describe('collection property handling', () => {
    describe('if a collection has properties', () => {
      let item;
      /** @type {VcsUiApp} */
      let app;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.maps.add(new ObliqueMap({ name: 'obl' }));
        await app.maps.setActiveMap('obl');
        const collection = new DefaultObliqueCollection({});
        collection.properties.defaultViewpoint = 'foo';
        app.obliqueCollections.add(collection);
        item = new ObliqueCollectionContentTreeItem(
          { name: 'foo', collectionName: collection.name },
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
    });

    describe('if a collection is overriden with less properties', () => {
      let item;
      /** @type {VcsUiApp} */
      let app;

      beforeAll(async () => {
        app = new VcsUiApp();
        app.maps.add(new ObliqueMap({ name: 'obl' }));
        await app.maps.setActiveMap('obl');
        const collection = new DefaultObliqueCollection({});
        collection.properties.defaultViewpoint = 'foo';
        app.obliqueCollections.add(collection);
        item = new ObliqueCollectionContentTreeItem(
          { name: 'foo', collectionName: collection.name },
          app,
        );
        const overrideCollection = new DefaultObliqueCollection({});
        overrideCollection.name = collection.name;
        app.obliqueCollections.override(overrideCollection);
      });

      afterAll(() => {
        app.destroy();
        item.destroy();
      });

      it('should not have a viewpoint action', () => {
        expect(item.actions.some((a) => a.name === 'ViewpointAction')).to.be
          .false;
      });
    });
  });

  describe('if collection is not present', () => {
    it('should not be visible', () => {
      const app = new VcsUiApp();
      const item = new ObliqueCollectionContentTreeItem(
        { name: 'foo', collectionName: 'foo' },
        app,
      );
      expect(item.visible).to.be.false;
      item.destroy();
      app.destroy();
    });
  });

  describe('serialize', () => {
    it('should serialize name, type and collectionName', () => {
      const app = new VcsUiApp();
      const item = new ObliqueCollectionContentTreeItem(
        { name: 'foo', collectionName: 'foo' },
        app,
      );
      const config = item.toJSON();
      expect(config).to.have.all.keys(['name', 'type', 'collectionName']);
      item.destroy();
      app.destroy();
    });
  });
});
