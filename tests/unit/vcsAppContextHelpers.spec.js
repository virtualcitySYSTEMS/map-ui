import { Collection, Layer, VcsMap, VcsObject, ViewPoint } from '@vcmap/core';
import {
  addConfigArrayToCollection,
  addObjectToCollection,
  contextIdSymbol, pluginFactorySymbol,
  removeContextFromShadowMaps,
  removeContextFromVcsObjectCollection,
} from '../../src/vcsAppContextHelpers.js';
import VcsApp from '../../src/vcsApp.js';

describe('vcs app context helpers', () => {
  describe('adding a VcsObject to a collection', () => {
    describe('if no object with said name exists', () => {
      let item;
      let returnedItem;
      let collection;

      before(() => {
        collection = new Collection();
        item = new VcsObject({ name: 'foo' });
        item[contextIdSymbol] = 'foo';
        returnedItem = addObjectToCollection(item, collection, new Map());
      });

      after(() => {
        item.destroy();
        collection.destroy();
      });

      it('should add the object to the collection', () => {
        expect(collection.has(item)).to.be.true;
      });

      it('should return the object', () => {
        expect(returnedItem).to.equal(item);
      });
    });

    describe('if an object with said name exists', () => {
      let item;
      let returnedItem;
      let collection;
      let shadowMap;

      before(() => {
        collection = new Collection();
        shadowMap = new Map();

        const existingItem = new VcsObject({ name: 'foo' });
        existingItem[contextIdSymbol] = 'foo';
        addObjectToCollection(existingItem, collection, shadowMap);

        item = new VcsObject({ name: 'foo' });
        item[contextIdSymbol] = 'bar';
        returnedItem = addObjectToCollection(item, collection, shadowMap);
      });

      after(() => {
        [...collection].forEach((i) => {
          i.destroy();
        });
        collection.destroy();
      });

      it('should add the object to the collection', () => {
        expect(collection.has(item)).to.be.true;
      });

      it('should return the object', () => {
        expect(returnedItem).to.equal(item);
      });

      it('should add a shadow of the object', () => {
        expect(shadowMap.has('foo')).to.be.true;
        const fooShadowMap = shadowMap.get('foo');
        expect(fooShadowMap).to.be.an('array')
          .and.to.have.lengthOf(1);
        expect(fooShadowMap[0]).to.have.property('name', 'foo');
        expect(fooShadowMap[0]).to.have.property(contextIdSymbol, 'foo');
      });
    });

    describe('if an object with said name exists and has already existed', () => {
      let item;
      let returnedItem;
      let collection;
      let shadowMap;

      before(() => {
        shadowMap = new Map();
        collection = new Collection();

        const existingItem1 = new VcsObject({ name: 'foo' });
        existingItem1[contextIdSymbol] = 'foo';
        addObjectToCollection(existingItem1, collection, shadowMap);

        const existingItem2 = new VcsObject({ name: 'foo' });
        existingItem2[contextIdSymbol] = 'bar';
        addObjectToCollection(existingItem2, collection, shadowMap);

        item = new VcsObject({ name: 'foo' });
        item[contextIdSymbol] = 'baz';
        returnedItem = addObjectToCollection(item, collection, shadowMap);
      });

      after(() => {
        [...collection].forEach((i) => {
          i.destroy();
        });
        collection.destroy();
      });

      it('should add the object to the collection', () => {
        expect(collection.has(item)).to.be.true;
      });

      it('should return the object', () => {
        expect(returnedItem).to.equal(item);
      });

      it('should add a shadow of the object', () => {
        expect(shadowMap.has('foo')).to.be.true;
        const fooShadowMap = shadowMap.get('foo');
        expect(fooShadowMap).to.be.an('array')
          .and.to.have.lengthOf(2);
        expect(fooShadowMap[0]).to.have.property('name', 'foo');
        expect(fooShadowMap[0]).to.have.property(contextIdSymbol, 'foo');

        expect(fooShadowMap[1]).to.have.property('name', 'foo');
        expect(fooShadowMap[1]).to.have.property(contextIdSymbol, 'bar');
      });
    });
  });

  describe('removing a context from a shadowMap', () => {
    it('should remove a shadow, if its part of the context', () => {
      const collection = new Collection();
      const shadowMap = new Map();

      const item1 = new VcsObject({ name: 'foo' });
      item1[contextIdSymbol] = 'foo';
      addObjectToCollection(item1, collection, shadowMap);

      const item2 = new VcsObject({ name: 'foo' });
      item2[contextIdSymbol] = 'bar';
      addObjectToCollection(item2, collection, shadowMap);

      const item3 = new VcsObject({ name: 'foo' });
      item3[contextIdSymbol] = 'baz';
      addObjectToCollection(item3, collection, shadowMap);

      removeContextFromShadowMaps('foo', { objects: shadowMap });

      expect(shadowMap.has('foo')).to.be.true;
      const fooShadowMap = shadowMap.get('foo');
      expect(fooShadowMap).to.be.an('array')
        .and.to.have.lengthOf(1);
      expect(fooShadowMap[0]).to.have.property('name', 'foo');
      expect(fooShadowMap[0]).to.have.property(contextIdSymbol, 'bar');

      [...collection].forEach((o) => { o.destroy(); });
      collection.destroy();
    });

    it('should remove all shadows of a context', () => {
      const collection = new Collection();
      const shadowMap = new Map();

      const item1 = new VcsObject({ name: 'foo' });
      item1[contextIdSymbol] = 'foo';
      addObjectToCollection(item1, collection, shadowMap);

      const item2 = new VcsObject({ name: 'foo' });
      item2[contextIdSymbol] = 'foo';
      addObjectToCollection(item2, collection, shadowMap);

      const item3 = new VcsObject({ name: 'foo' });
      item3[contextIdSymbol] = 'bar';
      addObjectToCollection(item3, collection, shadowMap);

      const item4 = new VcsObject({ name: 'foo' });
      item4[contextIdSymbol] = 'baz';
      addObjectToCollection(item4, collection, shadowMap);

      removeContextFromShadowMaps('foo', { objects: shadowMap });

      expect(shadowMap.has('foo')).to.be.true;
      const fooShadowMap = shadowMap.get('foo');
      expect(fooShadowMap).to.be.an('array')
        .and.to.have.lengthOf(1);
      expect(fooShadowMap[0]).to.have.property('name', 'foo');
      expect(fooShadowMap[0]).to.have.property(contextIdSymbol, 'bar');

      [...collection].forEach((o) => { o.destroy(); });
      collection.destroy();
    });

    it('should remove the map entry, if there are no more shadows after removing the context', () => {
      const collection = new Collection();
      const shadowMap = new Map();

      const item1 = new VcsObject({ name: 'foo' });
      item1[contextIdSymbol] = 'foo';
      addObjectToCollection(item1, collection, shadowMap);

      const item2 = new VcsObject({ name: 'foo' });
      item2[contextIdSymbol] = 'bar';
      addObjectToCollection(item2, collection, shadowMap);

      removeContextFromShadowMaps('foo', { objects: shadowMap });

      expect(shadowMap.has('foo')).to.be.false;
      [...collection].forEach((o) => { o.destroy(); });
      collection.destroy();
    });
  });

  describe('removing a context from a vcObject collection', () => {
    describe('if there is an object with said context', () => {
      let collection;
      let item;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.viewPoints;
        const shadowMap = new Map();
        item = new ViewPoint({ name: 'foo' });
        item[contextIdSymbol] = 'foo';
        addObjectToCollection(item, collection, shadowMap);
        await removeContextFromVcsObjectCollection('foo', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should remove the object from the collection', () => {
        expect(collection.has(item)).to.be.false;
      });

      it('should destroy the item', () => {
        expect(item.isDestroyed).to.be.true;
      });
    });

    describe('if there is an object with said context and there is one shadow of the object', () => {
      let collection;
      let item;
      let shadowMap;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        shadowMap = new Map();
        const item1 = new Layer({ name: 'foo' });
        item1[contextIdSymbol] = 'foo';
        addObjectToCollection(item1, collection, shadowMap);

        item = new Layer({ name: 'foo' });
        item[contextIdSymbol] = 'bar';
        addObjectToCollection(item, collection, shadowMap);

        await removeContextFromVcsObjectCollection('bar', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should remove the object from the collection', () => {
        expect(collection.has(item)).to.be.false;
      });

      it('should destroy the item', () => {
        expect(item.isDestroyed).to.be.true;
      });

      it('should remove the object name from the shadowMap', () => {
        expect(shadowMap.has('foo')).to.be.false;
      });

      it('should reincarnate the shadow', () => {
        const reincarnation = collection.getByKey('foo');
        expect(reincarnation).to.be.an.instanceOf(Layer);
        expect(reincarnation).to.have.property(contextIdSymbol, 'foo');
      });
    });

    describe('if there is an object with said context and there is more then one shadow of the object', () => {
      let collection;
      let item;
      let shadowMap;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        shadowMap = new Map();
        const item1 = new Layer({ name: 'foo' });
        item1[contextIdSymbol] = 'foo';
        addObjectToCollection(item1, collection, shadowMap);

        item = new Layer({ name: 'foo' });
        item[contextIdSymbol] = 'bar';
        addObjectToCollection(item, collection, shadowMap);

        item = new Layer({ name: 'foo' });
        item[contextIdSymbol] = 'baz';
        addObjectToCollection(item, collection, shadowMap);

        await removeContextFromVcsObjectCollection('baz', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should remove the object from the collection', () => {
        expect(collection.has(item)).to.be.false;
      });

      it('should destroy the item', () => {
        expect(item.isDestroyed).to.be.true;
      });

      it('should remove the last shadow from the shadowMap', () => {
        expect(shadowMap.has('foo')).to.be.true;
        const fooShadowMap = shadowMap.get('foo');
        expect(fooShadowMap).to.be.an('array')
          .and.to.have.lengthOf(1);
        expect(fooShadowMap[0]).to.have.property('name', 'foo');
        expect(fooShadowMap[0]).to.have.property(contextIdSymbol, 'foo');
      });

      it('should reincarnate the last pushed shadow', () => {
        const reincarnation = collection.getByKey('foo');
        expect(reincarnation).to.be.an.instanceOf(Layer);
        expect(reincarnation).to.have.property(contextIdSymbol, 'bar');
      });
    });

    describe('if there is a map with said context and there is a shadow of the map', () => {
      let collection;
      let item;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.maps;
        const shadowMap = new Map();
        const item1 = new VcsMap({ name: 'foo' });
        item1[contextIdSymbol] = 'foo';
        addObjectToCollection(item1, collection, shadowMap);

        item = new VcsMap({ name: 'foo' });
        item[contextIdSymbol] = 'bar';
        addObjectToCollection(item, collection, shadowMap);

        await removeContextFromVcsObjectCollection('bar', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should remove the object from the collection', () => {
        expect(collection.has(item)).to.be.false;
      });

      it('should destroy the item', () => {
        expect(item.isDestroyed).to.be.true;
      });

      it('should reincarnate the shadow', () => {
        const reincarnation = collection.getByKey('foo');
        expect(reincarnation).to.be.an.instanceOf(VcsMap);
        expect(reincarnation).to.have.property(contextIdSymbol, 'foo');
        expect(reincarnation).to.have.property('layerCollection', app.layers);
      });
    });

    describe('if there is a plugin with said context and there is a shadow of the plugin', () => {
      let collection;
      let item;
      let app;
      let pluginFactory;

      before(async () => {
        pluginFactory = async () => {
          return {
            name: 'foo',
            isDestroyed: false,
            destroy() {
              this.isDestroyed = true;
            },
            toJSON() {
              return {
                name: 'foo',
              };
            },
          };
        };

        app = new VcsApp();
        collection = app.plugins;
        const shadowMap = new Map();
        const item1 = await pluginFactory();
        item1[contextIdSymbol] = 'foo';
        item1[pluginFactorySymbol] = pluginFactory;
        addObjectToCollection(item1, collection, shadowMap);

        item = await pluginFactory();
        item[contextIdSymbol] = 'bar';
        item1[pluginFactorySymbol] = pluginFactory;
        addObjectToCollection(item, collection, shadowMap);

        await removeContextFromVcsObjectCollection('bar', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should remove the object from the collection', () => {
        expect(collection.has(item)).to.be.false;
      });

      it('should destroy the item', () => {
        expect(item.isDestroyed).to.be.true;
      });

      it('should reincarnate the shadow', () => {
        const reincarnation = collection.getByKey('foo');
        expect(reincarnation).to.be.an('object');
        expect(reincarnation).to.have.property(contextIdSymbol, 'foo');
        expect(reincarnation).to.have.property(pluginFactorySymbol, pluginFactory);
      });
    });
  });

  describe('adding an array of config options to a collection', () => {
    describe('if the array can be considered valid', () => {
      let collection;
      let items;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        const config = [
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'bar',
          },
        ];
        await addConfigArrayToCollection(config, collection, new Map(), 'foo', Layer);
        items = [...collection].filter(i => i[contextIdSymbol] === 'foo');
      });

      after(() => {
        app.destroy();
      });

      it('should add valid instances to the collection', () => {
        expect(items).to.have.length(2);
        expect(items.every(l => l instanceof Layer)).to.be.true;
      });

      it('should ensure the items are ordered', () => {
        expect(items[0]).to.have.property('name', 'foo');
        expect(items[1]).to.have.property('name', 'bar');
      });
    });

    describe('if the array contains faulty information', () => {
      let collection;
      let items;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        const config = [
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
          },
          {
            type: 'not a type',
            name: 'baz',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'bar',
          },
        ];
        await addConfigArrayToCollection(config, collection, new Map(), 'foo');
        items = [...collection].filter(i => i[contextIdSymbol] === 'foo');
      });

      after(() => {
        app.destroy();
      });

      it('should add valid instances to the collection', () => {
        expect(items).to.have.length(2);
        expect(items.every(l => l instanceof Layer)).to.be.true;
      });

      it('should ensure the items are ordered', () => {
        expect(items[0]).to.have.property('name', 'foo');
        expect(items[1]).to.have.property('name', 'bar');
      });
    });

    describe('if the array contains information not matching the type', () => {
      let collection;
      let items;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        const config = [
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
          },
          {
            type: 'vcs.vcm.maps.Cesium',
            name: 'baz',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'bar',
          },
        ];
        await addConfigArrayToCollection(config, collection, new Map(), 'foo', Layer);
        items = [...collection].filter(i => i[contextIdSymbol] === 'foo');
      });

      after(() => {
        app.destroy();
      });

      it('should add valid instances to the collection', () => {
        expect(items).to.have.length(2);
        expect(items.every(l => l instanceof Layer)).to.be.true;
      });

      it('should ensure the items are ordered', () => {
        expect(items[0]).to.have.property('name', 'foo');
        expect(items[1]).to.have.property('name', 'bar');
      });
    });

    describe('if the array contains duplicate entries', () => {
      let collection;
      let items;
      let shadowMap;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        const config = [
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'bar',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
            properties: {
              test: true,
            },
          },
        ];
        shadowMap = new Map();
        await addConfigArrayToCollection(config, collection, shadowMap, 'foo', Layer);
        items = [...collection].filter(i => i[contextIdSymbol] === 'foo');
      });

      after(() => {
        app.destroy();
      });

      it('should add instances to the collection', () => {
        expect(items).to.have.length(2);
        expect(items.every(l => l instanceof Layer)).to.be.true;
      });

      it('should ensure the items are ordered', () => {
        expect(items[0]).to.have.property('name', 'bar');
        expect(items[1]).to.have.property('name', 'foo');
        expect(items[1]).to.have.property('properties')
          .and.to.have.property('test', true);
      });

      it('should add duplicate entries to the shadow map', () => {
        expect(shadowMap.has('foo')).to.be.true;
      });
    });

    describe('and removing the entire context, if the array contains duplicate entries', () => {
      let collection;
      let shadowMap;
      let app;

      before(async () => {
        app = new VcsApp();
        collection = app.layers;
        const config = [
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'bar',
          },
          {
            type: 'vcs.vcm.layer.Layer',
            name: 'foo',
            properties: {
              test: true,
            },
          },
        ];
        shadowMap = new Map();
        await addConfigArrayToCollection(config, collection, shadowMap, 'foo', Layer);
        await removeContextFromShadowMaps('foo', { layers: shadowMap });
        await removeContextFromVcsObjectCollection('foo', collection, shadowMap, app);
      });

      after(() => {
        app.destroy();
      });

      it('should not recreate the shadows of the same context', () => {
        expect([...collection]).to.be.empty;
      });

      it('should ensure all shadows are gone', () => {
        expect(shadowMap).to.be.empty;
      });
    });
  });
});
