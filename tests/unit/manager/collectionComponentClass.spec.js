import {
  describe,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  it,
  vi,
} from 'vitest';
import {
  CesiumMap,
  Collection,
  IndexedCollection,
  makeOverrideCollection,
  MapCollection,
  ObliqueMap,
  OpenlayersMap,
} from '@vcmap/core';
import { toRaw } from 'vue';
import CollectionComponentClass, {
  createSupportedMapMappingFunction,
} from '../../../src/manager/collectionManager/collectionComponentClass.js';
import { sleep } from '../../helpers.js';

describe('CollectionComponentClass', () => {
  describe('create a new instance', () => {
    let collectionComponent;
    let collectionComponentOptions;
    let collection;
    let item;

    beforeAll(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponentOptions = {
        title: 'test',
        draggable: true,
        selectable: true,
        singleSelect: true,
        collection,
      };
      collectionComponent = new CollectionComponentClass(
        collectionComponentOptions,
        'test',
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should set an uuid, if not provided', () => {
      expect(collectionComponent).to.have.property('id');
    });

    it('should set the collection', () => {
      expect(collectionComponent).to.have.property('collection', collection);
    });

    it('should throw, if no collection is provided', () => {
      expect(CollectionComponentClass.bind(null, {}, 'test')).to.throw();
    });

    it('should throw, if provided collection has no unique key', () => {
      expect(
        CollectionComponentClass.bind(
          null,
          {
            collection: new IndexedCollection({ uniqueKey: undefined }),
          },
          'test',
        ),
      ).to.throw();
    });

    it('should apply provided options', () => {
      expect(collectionComponent.title.value).to.be.equal(
        collectionComponentOptions.title,
      );
      expect(collectionComponent.draggable.value).to.be.equal(
        collectionComponentOptions.draggable,
      );
      expect(collectionComponent.selectable.value).to.be.equal(
        collectionComponentOptions.selectable,
      );
      expect(collectionComponent.singleSelect.value).to.be.equal(
        collectionComponentOptions.singleSelect,
      );
    });

    it('should transform and insert all items of the collection', () => {
      expect(collectionComponent.items.value.length).to.be.equal(
        collection.size,
      );
      expect(collectionComponent.items.value[0]).to.have.property(
        'title',
        item.name,
      );
    });
  });

  describe('handle ui options', () => {
    let collectionComponent;
    let collection;
    let item;

    beforeAll(() => {
      collection = new Collection();
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should only allow draggable for IndexedCollections', async () => {
      collectionComponent.draggable.value = true;
      await sleep(0);
      expect(collectionComponent.draggable.value).to.be.false;
    });

    it('should add list item renamable action options, if renamable is true', async () => {
      collectionComponent.renamable.value = true;
      await sleep(0);
      expect(collectionComponent.items.value[0].renamable).to.have.property(
        'name',
        'list.renameItem',
      );
      collectionComponent.renamable.value = false;
      await sleep(0);
      expect(collectionComponent.items.value[0].renamable).to.be.undefined;
    });

    it('should add list item remove action, if removable is true', async () => {
      collectionComponent.removable.value = true;
      await sleep(0);
      expect(collectionComponent.items.value[0].actions).to.have.length(1);
      expect(collectionComponent.items.value[0].actions[0]).to.have.property(
        'name',
        'list.deleteItem',
      );
      collectionComponent.removable.value = false;
      await sleep(0);
      expect(collectionComponent.items.value[0].actions).to.have.length(0);
    });

    it('should add header action, if removable and selectable are true', async () => {
      collectionComponent.removable.value = true;
      collectionComponent.selectable.value = true;
      await sleep(0);
      expect(collectionComponent.getActions().value).to.have.length(1);
      expect(collectionComponent.getActions().value[0]).to.have.property(
        'name',
        'list.delete',
      );
      collectionComponent.removable.value = false;
      collectionComponent.selectable.value = false;
      await sleep(0);
      expect(collectionComponent.getActions().value).to.have.length(0);
    });
  });

  describe('handle item added', () => {
    let collectionComponent;
    let collection;
    let item;
    let addedItem;

    beforeAll(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      addedItem = {
        name: 'addedItem',
        properties: {
          title: 'addedTitle',
          icon: 'icon',
        },
      };
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should insert the item and apply item properties', () => {
      collection.add(addedItem);
      expect(collection).to.have.property('size', 2);
      expect(collectionComponent.items.value).to.have.length(2);
      const insertedListItem = collectionComponent.items.value.at(-1);
      expect(insertedListItem).to.have.property(
        'title',
        addedItem.properties.title,
      );
      expect(insertedListItem).to.have.property(
        'icon',
        addedItem.properties.icon,
      );
      collection.remove(addedItem);
    });

    it('should apply all itemFilters', () => {
      const itemFilter = {
        filterFunction: (i) => i.name !== addedItem.name,
        owner: 'test',
      };
      collectionComponent.addItemFilter(itemFilter);
      collection.add(addedItem);
      expect(collection).to.have.property('size', 2);
      expect(collectionComponent.items.value).to.have.length(1);
      collection.remove(addedItem);
      collectionComponent.removeItemFilter(itemFilter);
    });

    it('should apply all mappingFunctions', () => {
      const itemMapping = {
        mappingFunction: (i, c, l) => {
          l.actions = [{ name: 'action', callback: () => {} }];
          l.disabled = true;
        },
        owner: 'test',
      };
      collectionComponent.addItemMapping(itemMapping);
      collection.add(addedItem);
      expect(collection).to.have.property('size', 2);
      expect(collectionComponent.items.value).to.have.length(2);
      const insertedListItem = collectionComponent.items.value.at(-1);
      expect(insertedListItem.actions).to.have.length(1);
      expect(insertedListItem).to.have.property('disabled', true);
      collection.remove(addedItem);
      collectionComponent.addItemMapping(itemMapping);
    });
  });

  describe('handle item replaced', () => {
    let collectionComponent;
    let collection;
    let item;
    let addedItem;
    let replacedItem;

    beforeAll(() => {
      collection = makeOverrideCollection(
        new IndexedCollection(),
        () => 'dynamicModuleId',
      );
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      addedItem = {
        name: 'addedItem',
        properties: {
          title: 'addedTitle',
          icon: 'icon',
        },
      };
      replacedItem = {
        name: 'addedItem',
        properties: {
          title: 'replacedTitle',
          icon: 'replacedIcon',
        },
      };
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should update the item and apply replaced properties', () => {
      collection.add(addedItem);
      collection.replace(replacedItem);
      expect(collection).to.have.property('size', 2);
      expect(collectionComponent.items.value).to.have.length(2);
      const insertedListItem = collectionComponent.items.value.at(-1);
      expect(insertedListItem).to.have.property(
        'title',
        replacedItem.properties.title,
      );
      expect(insertedListItem).to.have.property(
        'icon',
        replacedItem.properties.icon,
      );
      collection.remove(replacedItem);
    });

    it('should preserve order for all underlying types of collections', () => {
      const collection2 = makeOverrideCollection(
        new Collection(),
        () => 'dynamicModuleId',
      );
      const collectionComponent2 = new CollectionComponentClass(
        { collection: collection2 },
        'test',
      );
      const firstItem = { name: 'first' };
      const lastItem = { name: 'last' };
      collection2.add(firstItem);
      collection2.add(addedItem);
      collection2.add(lastItem);
      expect(
        collectionComponent2.items.value.map(({ name }) => name),
      ).to.have.ordered.members([
        firstItem.name,
        addedItem.name,
        lastItem.name,
      ]);
      collection2.replace(replacedItem);
      expect(
        collectionComponent2.items.value.map(({ name }) => name),
      ).to.have.ordered.members([
        firstItem.name,
        addedItem.name,
        lastItem.name,
      ]);
    });

    it('should preserve selection', () => {
      collection.add(addedItem);
      collectionComponent.selection.value = [
        ...collectionComponent.items.value,
      ];
      expect(
        collectionComponent.selection.value.map(({ name }) => name),
      ).to.have.ordered.members([item.name, addedItem.name]);
      collection.replace(replacedItem);
      expect(
        collectionComponent.selection.value.map(({ name }) => name),
      ).to.have.ordered.members([item.name, addedItem.name]);
    });
  });

  describe('handle item moved', () => {
    let collectionComponent;
    let collection;
    let item;
    let item2;

    beforeAll(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      item2 = { name: 'testItem2' };
      collection.add(item);
      collection.add(item2);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should synchronize the item order on move', () => {
      expect(
        collectionComponent.items.value.map(({ name }) => name),
      ).to.have.ordered.members([item.name, item2.name]);
      collection.moveTo(item, 1);
      expect(
        collectionComponent.items.value.map(({ name }) => name),
      ).to.have.ordered.members([item2.name, item.name]);
    });
  });

  describe('handle item removed', () => {
    let collectionComponent;
    let collection;
    let item;
    let item2;

    beforeEach(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      item2 = { name: 'testItem2' };
      collection.add(item);
      collection.add(item2);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
    });

    afterEach(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should synchronize the collection items with the internal list items', () => {
      expect(collection).to.have.property('size', 2);
      expect(collectionComponent.items.value).to.have.length(2);
      collection.remove(item2);
      expect(collection).to.have.property('size', 1);
      expect(collectionComponent.items.value).to.have.length(1);
      expect(
        collectionComponent.items.value.map(({ name }) => name),
      ).to.not.include(item2.name);
    });

    it('should remove removed item from selection', () => {
      const listItem2 = collectionComponent.items.value.find(
        (l) => l.name === item2.name,
      );
      collectionComponent.selection.value = [listItem2];
      expect(collectionComponent.selection.value).to.have.length(1);
      collection.remove(item2);
      expect(collectionComponent.selection.value).to.be.empty;
    });
  });

  describe('item mapping', () => {
    let collectionComponent;
    let collection;
    let item;
    let itemMapping;

    beforeAll(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      itemMapping = {
        mappingFunction: (i, c, l) => {
          l.actions = [{ name: 'action', callback: () => {} }];
          l.disabled = true;
        },
        owner: 'test',
      };
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should reset list items, when an item mapping is added', () => {
      expect(collectionComponent.items.value[0].actions).to.have.length(0);
      expect(collectionComponent.items.value[0]).to.have.property(
        'disabled',
        undefined,
      );
      collectionComponent.addItemMapping(itemMapping);
      expect(collectionComponent.items.value[0].actions).to.have.length(1);
      expect(collectionComponent.items.value[0]).to.have.property(
        'disabled',
        true,
      );
    });

    it('should reset list items, when an item mapping is removed', () => {
      expect(collectionComponent.items.value[0].actions).to.have.length(1);
      expect(collectionComponent.items.value[0]).to.have.property(
        'disabled',
        true,
      );
      collectionComponent.removeItemMapping(itemMapping);
      expect(collectionComponent.items.value[0].actions).to.have.length(0);
      expect(collectionComponent.items.value[0]).to.have.property(
        'disabled',
        undefined,
      );
    });

    it('should not add the same mapping function twice', () => {
      collectionComponent.addItemMapping(itemMapping);
      collectionComponent.addItemMapping(itemMapping);
      expect(collectionComponent._itemMappings).to.have.length(1);
    });
  });

  describe('item filter', () => {
    let collectionComponent;
    let collection;
    let item;
    let itemFilter;

    beforeAll(() => {
      collection = new IndexedCollection();
      item = { name: 'testItem' };
      collection.add(item);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      itemFilter = {
        filterFunction: (i) => i.name !== item.name,
        owner: 'test',
      };
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should reset list items, when an item filter is added', () => {
      expect(collectionComponent.items.value).to.have.length(1);
      collectionComponent.addItemFilter(itemFilter);
      expect(collectionComponent.items.value).to.have.length(0);
    });

    it('should reset list items, when an item filter is removed', () => {
      expect(collectionComponent.items.value).to.have.length(0);
      collectionComponent.removeItemFilter(itemFilter);
      expect(collectionComponent.items.value).to.have.length(1);
    });

    it('should not add the same filter function twice', () => {
      collectionComponent.addItemFilter(itemFilter);
      collectionComponent.addItemFilter(itemFilter);
      expect(collectionComponent._itemFilters).to.have.length(1);
    });
  });

  describe('actions', () => {
    let collectionComponent;
    let collection;
    let ownedAction;

    beforeAll(() => {
      collection = new IndexedCollection();
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      ownedAction = {
        action: { name: 'action', callback: () => {} },
        owner: 'test',
      };
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should add actions sorted by weight', () => {
      collectionComponent.addActions([ownedAction]);
      expect(
        collectionComponent.getActions().value.map((a) => toRaw(a)),
      ).to.include(ownedAction.action);
    });

    it('should remove actions', () => {
      collectionComponent.addActions([ownedAction]);
      collectionComponent.removeActions([ownedAction]);
      expect(
        collectionComponent.getActions().value.map((a) => toRaw(a)),
      ).to.not.include(ownedAction.action);
    });

    it('should not add the same actions twice', () => {
      collectionComponent.addActions([ownedAction]);
      collectionComponent.addActions([ownedAction]);
      expect(collectionComponent._actions.value).to.have.length(1);
    });
  });

  describe('remove owner', () => {
    let collectionComponent;
    let collection;
    let item;
    let itemMapping;
    let itemFilter;
    let ownedAction;
    let resetSpy;

    beforeAll(() => {
      collection = new IndexedCollection();
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
      item = { name: 'testItem' };
      collection.add(item);
      itemMapping = {
        mappingFunction: (i, c, l) => {
          l.actions = [{ name: 'action', callback: () => {} }];
          l.disabled = true;
        },
        owner: 'removedOwner',
      };
      itemFilter = {
        filterFunction: (i) => i.name !== item.name,
        owner: 'removedOwner',
      };
      ownedAction = {
        action: { name: 'action', callback: () => {} },
        owner: 'removedOwner',
      };
      collectionComponent.addItemMapping(itemMapping);
      collectionComponent.addItemFilter(itemFilter);
      collectionComponent.addActions([ownedAction]);
      resetSpy = vi.spyOn(collectionComponent, 'reset');
      collectionComponent.removeOwner('removedOwner');
    });

    afterAll(() => {
      collectionComponent.destroy();
      collection.destroy();
    });

    it('should remove all itemMapping, itemFilter and actions of provided owner', () => {
      expect(collectionComponent._itemMappings).to.have.length(0);
      expect(collectionComponent._itemFilters).to.have.length(0);
      expect(collectionComponent._actions.value).to.have.length(0);
    });

    it('should trigger reset, if mappings, filters or actions have changed', () => {
      expect(resetSpy).toHaveBeenCalled();
    });

    it('should not trigger reset, if no changes happened', () => {
      const resetSpy2 = vi.spyOn(collectionComponent, 'reset');
      collectionComponent.removeOwner('removedOwner');
      expect(resetSpy2).not.toHaveBeenCalled();
    });
  });

  describe('pagination', () => {
    /**
     * Helper to create a fake async loader.
     * @param {number} total
     * @returns {(start:number,count:number)=>Promise<{items: any[], total:number}>}
     */
    function createLoader(total) {
      const items = Array.from({ length: total }).map((_, i) => ({
        name: `item-${i + 1}`,
      }));
      return async (start, count) => {
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
        return {
          items: items.slice(start, start + count),
          total: items.length,
        };
      };
    }

    let collection;

    beforeEach(() => {
      collection = new Collection();
    });

    afterEach(() => {
      collection?.destroy();
    });

    it('should not expose totalCount, page or pageSize before initialize', () => {
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: createLoader(25) } },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      expect(p.initialized).to.be.false;
      expect(() => p.totalCount).to.throw();
      expect(() => p.getPage()).to.throw();
      component.destroy();
    });

    it('should initialize and load first page with default settings', async () => {
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: createLoader(25) } },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      await p.initialize();
      expect(p.initialized).to.be.true;
      expect(p.getPage()).to.equal(1);
      expect(p.getPageSize()).to.equal(10); // defaultPageSize
      expect(p.totalCount).to.equal(25);
      expect(p.getPageItems().length).to.equal(10);
      component.destroy();
    });

    it('should honor initialPage and defaultPageSize', async () => {
      const component = new CollectionComponentClass(
        {
          collection,
          pagination: {
            getItems: createLoader(50),
            defaultPageSize: 5,
            initialPage: 3,
          },
        },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      await p.initialize();
      expect(p.getPage()).to.equal(3);
      expect(p.getPageSize()).to.equal(5);
      expect(p.getPageItems().length).to.equal(5);
      expect(p.getPageItems().map((i) => i.name)).to.have.ordered.members([
        'item-11',
        'item-12',
        'item-13',
        'item-14',
        'item-15',
      ]);
      component.destroy();
    });

    it('should change page and reload items, firing pageChanged', async () => {
      const pageChanged = vi.fn();
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: createLoader(30) } },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      p.pageChanged.addEventListener(pageChanged);
      await p.initialize();
      await p.setPage(2);
      expect(p.getPage()).to.equal(2);
      expect(pageChanged).toHaveBeenCalledTimes(2); // initial + page 2
      expect(p.getPageItems().map((i) => i.name)[0]).to.equal('item-11');
      component.destroy();
    });

    it('should change pageSize, reset to page 1 and fire pageSizeChanged with new size', async () => {
      const pageSizeChanged = vi.fn();
      const component = new CollectionComponentClass(
        {
          collection,
          pagination: { getItems: createLoader(40), defaultPageSize: 8 },
        },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      await p.initialize();
      p.pageSizeChanged.addEventListener(pageSizeChanged);
      await p.setPage(3); // move away from page 1
      expect(p.getPage()).to.equal(3);
      await p.setPageSize(5); // should reset to page 1
      expect(p.getPage()).to.equal(1);
      expect(p.getPageSize()).to.equal(5);
      expect(pageSizeChanged).toHaveBeenCalledWith(5);
      expect(p.getPageItems().map((i) => i.name)).to.have.ordered.members([
        'item-1',
        'item-2',
        'item-3',
        'item-4',
        'item-5',
      ]);
      component.destroy();
    });

    it('setPagination(undefined) should clear collection and remove pagination instance', async () => {
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: createLoader(12) } },
        'test',
      );
      const p = component.pagination.value;
      expect(p).to.not.be.undefined;
      await p.initialize();
      expect(p.getPageItems().length).to.equal(10);
      component.setPagination(undefined);
      expect(component.pagination.value).to.be.undefined;
      expect(p.getPageItems().length).to.equal(0);
      component.destroy();
    });

    it('should handle concurrent setPage calls and only apply the latest resolved result', async () => {
      // create a loader we can control for page > 1 while letting initialization resolve immediately
      /** @type {Array<() => void>} */
      const pendingResolvers = [];
      /**
       * @param {number} start
       * @param {number} count
       * @returns {Promise<{items:any[], total:number}>}
       */
      const loader = (start, count) => {
        const total = 30;
        const allItems = Array.from({ length: total }).map((_, i) => ({
          name: `item-${i + 1}`,
        }));
        return new Promise((resolve) => {
          pendingResolvers.push(() => {
            resolve({
              items: allItems.slice(start, start + count),
              total,
            });
          });
        });
      };
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: loader } },
        'test',
      );
      const p = /** @type {any} */ (component.pagination.value);
      // fire two page changes quickly (both will stay pending until we resolve)
      const setPage2Promise = p.setPage(2);
      const setPage3Promise = p.setPage(3);
      expect(pendingResolvers).to.have.length(2);
      const [resolvePage2, resolvePage3] = pendingResolvers; // order they were queued
      // Resolve last request (page3) first so it should win
      resolvePage3();
      await setPage3Promise;
      // Resolve stale page2 afterwards
      resolvePage2();
      await setPage2Promise;
      expect(p.getPage()).to.equal(3); // should remain page 3
      component.destroy();
    });

    it('should only fire pageChanged once when initialize is called twice', async () => {
      const pageChanged = vi.fn();
      const component = new CollectionComponentClass(
        { collection, pagination: { getItems: createLoader(10) } },
        'test',
      );
      const p = /** @type {any} */ (component.pagination.value);
      p.pageChanged.addEventListener(pageChanged);
      const init1 = p.initialize();
      const init2 = p.initialize();
      await Promise.all([init1, init2]);
      expect(pageChanged).toHaveBeenCalledTimes(1);
      expect(p.initialized).to.be.true;
      component.destroy();
    });
  });

  describe('createSupportedMapMappingFunction', () => {
    let mapCollection;
    let collectionComponent;
    let collection;
    let item;
    let item2;

    beforeAll(() => {
      mapCollection = new MapCollection();
      mapCollection.add(new OpenlayersMap({ name: 'ol' }));
      mapCollection.add(new ObliqueMap({ name: 'oblique' }));
      mapCollection.setActiveMap('ol');
      collection = new IndexedCollection();
      item = { name: 'item' };
      item2 = { name: 'item2' };
      collection.add(item);
      collection.add(item2);
      collectionComponent = new CollectionComponentClass(
        { collection },
        'test',
      );
    });

    afterAll(() => {
      collection.destroy();
      [...mapCollection].forEach((map) => map.destroy());
      mapCollection.destroy();
      collectionComponent.destroy();
    });

    it('should disable list items for unsupported maps, when providing a string array', () => {
      collectionComponent.addItemMapping({
        mappingFunction: createSupportedMapMappingFunction(
          [CesiumMap.className],
          mapCollection,
        ),
        owner: 'test',
      });
      expect(collectionComponent.getListItemForItem(item)).to.have.property(
        'disabled',
        true,
      );
      expect(collectionComponent.getListItemForItem(item2)).to.have.property(
        'disabled',
        true,
      );
    });

    it('should disable list items for unsupported maps, when providing supportedMaps function', () => {
      collectionComponent.addItemMapping({
        mappingFunction: createSupportedMapMappingFunction((i) => {
          if (i.name === item.name) {
            return [OpenlayersMap.className];
          } else {
            return [ObliqueMap.className];
          }
        }, mapCollection),
        owner: 'test',
      });
      expect(collectionComponent.getListItemForItem(item)).to.have.property(
        'disabled',
        false,
      );
      expect(collectionComponent.getListItemForItem(item2)).to.have.property(
        'disabled',
        true,
      );
    });

    it('should update list items disabled state on map change', async () => {
      collectionComponent.addItemMapping({
        mappingFunction: createSupportedMapMappingFunction((i) => {
          if (i.name === item.name) {
            return [OpenlayersMap.className];
          } else {
            return [ObliqueMap.className];
          }
        }, mapCollection),
        owner: 'test',
      });
      expect(collectionComponent.getListItemForItem(item)).to.have.property(
        'disabled',
        false,
      );
      expect(collectionComponent.getListItemForItem(item2)).to.have.property(
        'disabled',
        true,
      );
      await mapCollection.setActiveMap('oblique');
      expect(collectionComponent.getListItemForItem(item)).to.have.property(
        'disabled',
        true,
      );
      expect(collectionComponent.getListItemForItem(item2)).to.have.property(
        'disabled',
        false,
      );
    });
  });
});
