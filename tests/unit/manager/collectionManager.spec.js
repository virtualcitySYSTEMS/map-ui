import {
  describe,
  beforeAll,
  afterAll,
  expect,
  it,
  vi,
  beforeEach,
  afterEach,
} from 'vitest';
import { IndexedCollection } from '@vcmap/core';
import CollectionManager from '../../../src/manager/collectionManager/collectionManager.js';

describe('CollectionManager', () => {
  describe('adding collectionComponents', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent;
    let addedSpy;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      addedSpy = vi.fn();
      collectionManager.added.addEventListener(addedSpy);
      collectionComponentOptions = {
        id: 'test',
        collection: new IndexedCollection(),
      };
      collectionComponent = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    it('should add the collectionComponent to the manager', () => {
      expect(collectionManager.has(collectionComponent.id));
    });
    it('should add the componentId to the componentIds array', () => {
      expect(collectionManager.componentIds).to.have.members([
        collectionComponent.id,
      ]);
    });
    it('should fire the added Event', () => {
      expect(addedSpy).toHaveBeenCalledTimes(1);
      expect(addedSpy).toHaveBeenLastCalledWith(collectionComponent);
    });
    it('should throw if no owner is supplied', () => {
      expect(
        collectionManager.add.bind(
          collectionManager,
          collectionComponentOptions,
        ),
      ).to.throw();
    });
    it('should throw if same componentId is already managed', () => {
      expect(
        collectionManager.add.bind(collectionManager, [
          collectionComponentOptions,
          'plugin',
        ]),
      ).to.throw();
    });
  });

  describe('removing collectionComponents', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent1;
    let collectionComponent2;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      collectionComponentOptions = {
        collection: new IndexedCollection(),
      };
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    beforeEach(() => {
      collectionComponent1 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionComponent2 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
    });

    afterEach(() => {
      collectionManager.clear();
    });

    it('should remove it from the collectionManager', () => {
      expect(collectionManager.has(collectionComponent1.id)).to.be.true;
      collectionManager.remove(collectionComponent1.id);
      expect(collectionManager.has(collectionComponent1.id)).to.be.false;
      expect(collectionManager.has(collectionComponent2.id)).to.be.true;
    });
    it('should remove the removed id from the componentId List', () => {
      expect(collectionManager.componentIds).to.include(
        collectionComponent1.id,
      );
      collectionManager.remove(collectionComponent1.id);
      expect(collectionManager.componentIds).to.not.include(
        collectionComponent1.id,
      );
    });
    it('should fire the removed event', () => {
      const removedSpy = vi.fn();
      collectionManager.removed.addEventListener(removedSpy);
      collectionManager.remove(collectionComponent1.id);
      expect(removedSpy).toHaveBeenCalledTimes(1);
      expect(removedSpy).toHaveBeenLastCalledWith(collectionComponent1);
    });
  });

  describe('add mapping function', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent1;
    let collectionComponent2;
    let mappingFunction;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      collectionComponentOptions = {
        collection: new IndexedCollection(),
      };
      mappingFunction = () => {};
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    afterEach(() => {
      collectionManager.clear();
    });

    it('should cache and add mapping function to collectionComponents of provided ids', () => {
      collectionComponent1 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionComponent2 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionManager.addMappingFunction(undefined, mappingFunction, 'test', [
        collectionComponent1.id,
      ]);
      expect(collectionManager._itemMappings).to.have.length(1);
      expect(collectionComponent1._itemMappings).to.have.length(1);
      expect(collectionComponent2._itemMappings).to.have.length(0);
    });

    it('should add cached mapping function on collectionComponent added', () => {
      collectionManager.addMappingFunction(undefined, mappingFunction, 'test', [
        'collectionComponent1',
      ]);
      expect(collectionManager._itemMappings).to.have.length(1);
      collectionComponent1 = collectionManager.add(
        { ...collectionComponentOptions, id: 'collectionComponent1' },
        'test',
      );
      expect(collectionComponent1._itemMappings).to.have.length(1);
    });

    it('should not add the same mapping function twice', () => {
      collectionManager.addMappingFunction(undefined, mappingFunction, 'test', [
        'collectionComponent1',
      ]);
      collectionManager.addMappingFunction(undefined, mappingFunction, 'test', [
        'collectionComponent1',
      ]);
      expect(collectionManager._itemMappings).to.have.length(1);
    });
  });

  describe('add filter function', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent1;
    let collectionComponent2;
    let filterFunction;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      collectionComponentOptions = {
        collection: new IndexedCollection(),
      };
      filterFunction = () => {};
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    afterEach(() => {
      collectionManager.clear();
    });

    it('should cache and add filter function to collectionComponents of provided ids', () => {
      collectionComponent1 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionComponent2 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionManager.addFilterFunction(filterFunction, 'test', [
        collectionComponent1.id,
      ]);
      expect(collectionManager._itemFilters).to.have.length(1);
      expect(collectionComponent1._itemFilters).to.have.length(1);
      expect(collectionComponent2._itemFilters).to.have.length(0);
    });

    it('should add cached filter function on collectionComponent added', () => {
      collectionManager.addFilterFunction(filterFunction, 'test', [
        'collectionComponent1',
      ]);
      expect(collectionManager._itemFilters).to.have.length(1);
      collectionComponent1 = collectionManager.add(
        { ...collectionComponentOptions, id: 'collectionComponent1' },
        'test',
      );
      expect(collectionComponent1._itemFilters).to.have.length(1);
    });

    it('should not add the same filter function twice', () => {
      collectionManager.addFilterFunction(filterFunction, 'test', [
        'collectionComponent1',
      ]);
      collectionManager.addFilterFunction(filterFunction, 'test', [
        'collectionComponent1',
      ]);
      expect(collectionManager._itemFilters).to.have.length(1);
    });
  });

  describe('add actions', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent1;
    let collectionComponent2;
    let actions;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      collectionComponentOptions = {
        collection: new IndexedCollection(),
      };
      actions = [{ name: 'action', callback: () => {} }];
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    afterEach(() => {
      collectionManager.clear();
    });

    it('should cache and add actions to collectionComponents of provided ids', () => {
      collectionComponent1 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionComponent2 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
      collectionManager.addActions(actions, 'test', [collectionComponent1.id]);
      expect(collectionManager._actions).to.have.length(1);
      expect(collectionComponent1._actions.value).to.have.length(1);
      expect(collectionComponent2._actions.value).to.have.length(0);
    });

    it('should add cached actions on collectionComponent added', () => {
      collectionManager.addActions(actions, 'test', ['collectionComponent1']);
      expect(collectionManager._actions).to.have.length(1);
      collectionComponent1 = collectionManager.add(
        { ...collectionComponentOptions, id: 'collectionComponent1' },
        'test',
      );
      expect(collectionComponent1._actions.value).to.have.length(1);
    });

    it('should not add the same actions twice', () => {
      collectionManager.addActions(actions, 'test', ['collectionComponent1']);
      collectionManager.addActions(actions, 'test', ['collectionComponent1']);
      expect(collectionManager._actions).to.have.length(1);
    });
  });

  describe('remove owner', () => {
    let collectionManager;
    let collectionComponentOptions;
    let collectionComponent1;
    let collectionComponent2;

    beforeAll(() => {
      collectionManager = new CollectionManager();
      collectionComponentOptions = {
        collection: new IndexedCollection(),
      };
    });

    afterAll(() => {
      collectionManager.destroy();
    });

    beforeEach(() => {
      collectionComponent1 = collectionManager.add(
        collectionComponentOptions,
        'plugin',
      );
      collectionComponent2 = collectionManager.add(
        collectionComponentOptions,
        'test',
      );
    });

    afterEach(() => {
      collectionManager.clear();
    });

    it('should remove all collectionComponents of supplied owner from the collectionManager', () => {
      expect(collectionManager.has(collectionComponent1.id)).to.be.true;
      collectionManager.removeOwner('plugin');
      expect(collectionManager.has(collectionComponent1.id)).to.be.false;
      expect(collectionManager.has(collectionComponent2.id)).to.be.true;
    });
  });
});
