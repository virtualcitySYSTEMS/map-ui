import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { VcsModule } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import CategoryManager from '../../../src/manager/collectionManager/categoryManager.js';

describe('categoryManager', () => {
  let app;

  beforeAll(async () => {
    app = new VcsUiApp();
  });

  afterAll(() => {
    app.destroy();
  });

  describe('request a new category', () => {
    /** @type {CategoryManager} */
    let categoryManager;
    let category1;
    let category2;
    let collectionComponent1;
    let collectionComponent2;
    let added;

    beforeAll(async () => {
      added = vi.fn();
      categoryManager = new CategoryManager(app);
      categoryManager.added.addEventListener(added);
      const request1 = await categoryManager.requestCategory(
        {
          name: 'cat1',
        },
        'myOwner',
      );
      category1 = request1.category;
      collectionComponent1 = request1.collectionComponent;
      const request2 = await categoryManager.requestCategory(
        {
          name: 'cat2',
        },
        'myOwner',
        {
          id: 'collectionComponentId',
        },
      );
      category2 = request2.category;
      collectionComponent2 = request2.collectionComponent;
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should add a collectionComponent for both categories and add both to the component ids', () => {
      expect(categoryManager.componentIds.length).to.be.equal(2);
      expect(categoryManager.componentIds).to.have.ordered.members([
        'cat1',
        'cat2',
      ]);
    });

    it('should set the category name as collectionComponent id', () => {
      expect(collectionComponent2.id).to.be.equal(category2.name);
    });

    it('should set the title of the managed category', () => {
      expect(collectionComponent1).to.not.be.null;
      expect(collectionComponent1.title.value).to.equal(category1.name);
    });

    it('should call the added event for every newly added managed category', () => {
      expect(added).toHaveBeenCalledTimes(2);
    });
  });

  describe('dynamicModuleChanged', () => {
    let categoryManager;
    let category;
    let collectionComponent;

    beforeAll(async () => {
      categoryManager = new CategoryManager(app);
      ({ category, collectionComponent } =
        await categoryManager.requestCategory(
          {
            name: 'cat1',
          },
          'myOwner',
        ));
      await app.categories.parseCategoryItems(
        'cat1',
        [{ name: 'item1' }, { name: 'item2' }],
        app.dynamicModuleId,
      );
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    describe('should filter ', () => {
      let module;

      beforeEach(async () => {
        module = new VcsModule({});
        await app.addModule(module);
        app.setDynamicModule(module);
      });

      afterEach(async () => {
        app.resetDynamicModule();
        await app.removeModule(module._id);
      });

      it('should synchronize the category items in the managed category list', () => {
        expect(collectionComponent.items.value).to.have.lengthOf(0);
      });

      it('should add newly added category items to the managed category list', () => {
        const item6 = { name: 'item6' };
        category.collection.add(item6);
        expect(collectionComponent.items.value).to.have.lengthOf(1);
        category.collection.remove(item6);
      });

      it('should update after resetting the dynamicModule', () => {
        app.resetDynamicModule();
        expect(collectionComponent.items.value).to.have.lengthOf(2);
      });

      it('should ignore removing an item from a module which is not the dynamicModule', () => {
        const item6 = { name: 'item6' };
        category.collection.add(item6);
        app.resetDynamicModule();
        category.collection.remove(item6);
        expect(collectionComponent.items.value).to.have.lengthOf(2);
      });
    });
  });

  describe('removed category from the app', () => {
    let category;
    let categoryManager;

    beforeAll(async () => {
      categoryManager = new CategoryManager(app);
      ({ category } = await categoryManager.requestCategory(
        {
          name: 'cat3',
        },
        'myOwner',
      ));
      await app.categories.parseCategoryItems(
        'cat3',
        [{ name: 'item1' }, { name: 'item2' }],
        app.dynamicModuleId,
      );
      app.categories.remove(category);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should update the managed category', () => {
      expect(categoryManager.componentIds).to.have.lengthOf(0);
    });
  });
});
