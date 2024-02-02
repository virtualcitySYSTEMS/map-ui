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
  Collection,
  IndexedCollection,
  makeOverrideCollection,
} from '@vcmap/core';
import CollectionComponentClass from '../../../src/manager/collectionManager/collectionComponentClass.js';
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

    it('should add list item rename action, if renamable is true', async () => {
      collectionComponent.renamable.value = true;
      await sleep(0);
      expect(collectionComponent.items.value[0].actions).to.have.length(1);
      expect(collectionComponent.items.value[0].actions[0]).to.have.property(
        'name',
        'list.renameItem',
      );
      collectionComponent.renamable.value = false;
      await sleep(0);
      expect(collectionComponent.items.value[0].actions).to.have.length(0);
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
      expect(collectionComponent.getActions().value).to.include(
        ownedAction.action,
      );
    });

    it('should remove actions', () => {
      collectionComponent.removeActions([ownedAction]);
      expect(collectionComponent.getActions().value).to.not.include(
        ownedAction.action,
      );
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
});
