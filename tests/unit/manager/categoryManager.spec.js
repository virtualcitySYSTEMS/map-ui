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
import CategoryManager from '../../../src/manager/categoryManager/categoryManager.js';

describe('categoryManager', () => {
  let app;
  let category1;
  let category2;

  beforeAll(async () => {
    app = new VcsUiApp();
    category1 = await app.categories.requestCategory({
      name: 'cat1',
      type: 'Category',
    });
    category2 = await app.categories.requestCategory({
      name: 'cat2',
      type: 'Category',
      keyProperty: 'id',
    });
    await app.categories.parseCategoryItems(
      'cat1',
      [{ name: 'item1' }, { name: 'item2' }],
      app.dynamicModuleId,
    );
    await app.categories.parseCategoryItems(
      'cat2',
      [{ id: 'item3' }, { id: 'item4' }, { id: 'item5' }],
      app.dynamicModuleId,
    );
  });

  afterAll(() => {
    app.destroy();
  });

  describe('adding categories', () => {
    /** @type {CategoryManager} */
    let categoryManager;
    let added;

    beforeAll(() => {
      added = vi.fn();
      categoryManager = new CategoryManager(app);
      categoryManager.added.addEventListener(added);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
      );
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should add both categories to the component ids', () => {
      expect(categoryManager.componentIds.length).to.be.equal(2);
      expect(categoryManager.componentIds).to.have.ordered.members([
        'cat1',
        'cat2',
      ]);
    });

    it('should set the title of the managed category', () => {
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem).to.not.be.null;
      expect(categoryTreeViewItem.title).to.equal(category1.name);
    });

    it('should merge the actions in the items with several owners', () => {
      const cat1Item = categoryManager.get(category1.name);
      expect(cat1Item.actions).to.have.lengthOf(2);
    });

    it('should set the actions in the managed category', () => {
      const cat2Item = categoryManager.get(category2.name);
      expect(cat2Item.actions).to.have.lengthOf(1);
    });

    it('should not overwrite an item, when adding the same category again', () => {
      const cat2Item = categoryManager.get(category2.name);
      categoryManager.add({ categoryName: 'cat2' }, 'foo');
      expect(categoryManager.get(category2.name)).to.equal(cat2Item);
    });

    it('should call the added event for every newly added managed category', () => {
      expect(added).toHaveBeenCalledTimes(2);
    });

    describe('category items', () => {
      let cat1Item;
      let cat2Item;

      beforeAll(() => {
        cat1Item = categoryManager.get(category1.name);
        cat2Item = categoryManager.get(category2.name);
      });

      it('should add the category items in the managed category', () => {
        expect(cat1Item.items).to.have.lengthOf(2);
        expect(cat2Item.items).to.have.lengthOf(3);
      });

      it('should set the id property on the category items in the managed category', () => {
        expect(cat1Item.items[0].id).to.be.equal('item1');
        expect(cat2Item.items[0].id).to.be.equal('item3');
      });

      it('should set the title property on the category items in the managed category', () => {
        expect(cat1Item.items[0].title).to.be.equal('item1');
        expect(cat2Item.items[0].title).to.be.equal('item3');
      });

      it('should update items list on adding/removing new items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem);
        expect(cat1Item.items).to.have.lengthOf(3);
        expect(cat1Item.items[2].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.items).to.have.lengthOf(2);
      });

      it('should respect the order of added new Items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem, 0);
        expect(cat1Item.items).to.have.lengthOf(3);
        expect(cat1Item.items[0].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.items).to.have.lengthOf(2);
      });

      it('should respect the order of added new items in between existing items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem, 1);
        expect(cat1Item.items).to.have.lengthOf(3);
        expect(cat1Item.items[1].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.items).to.have.lengthOf(2);
      });

      it('should handle moving of items in the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem);
        expect(cat1Item.items).to.have.lengthOf(3);
        expect(cat1Item.items[2].id).to.be.equal('itemNew');
        category1.collection.lower(newItem, 2);
        expect(cat1Item.items[0].id).to.be.equal('itemNew');
        category1.collection.raise(newItem, 1);
        expect(cat1Item.items[1].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
      });

      it('should ignore newly added items not associated to the dynamicModule', async () => {
        expect(cat1Item.items).to.have.lengthOf(2);
        const newModule = new VcsModule({});
        await app.addModule(newModule);
        await app.categories.parseCategoryItems(
          'cat1',
          [{ name: 'item7' }, { name: 'item8' }],
          newModule._id,
        );
        expect(cat1Item.items).to.have.lengthOf(2);
        await app.removeModule(newModule._id);
      });
    });
  });

  describe('merging options', () => {
    /** @type {CategoryManager} */
    let categoryManager;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        { categoryName: 'cat1', selectable: true },
        'myOwner1',
      );
      categoryManager.add(
        { categoryName: 'cat1', selectable: false, singleSelect: true },
        'myOwner2',
      );
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should set the first selectable option', () => {
      expect(categoryManager.get('cat1')).to.have.property('selectable', true);
    });

    it('should set the first singleSelect option', () => {
      expect(categoryManager.get('cat1')).to.have.property(
        'singleSelect',
        true,
      );
    });
  });

  describe('removing categories', () => {
    let categoryManager;
    let destroy;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      destroy = vi.fn();
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.addMappingFunction(
        (i) => i.id === 'item3',
        (i, c, listItem) => {
          listItem.destroy = destroy;
          return listItem;
        },
        ['cat2'],
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
      );
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    describe('removing a category with only 1 owner', () => {
      let removed;
      let addedListenerNumber;
      let removedListenerNumber;
      let replacedListenerNumber;

      beforeAll(() => {
        removed = vi.fn();
        categoryManager.removed.addEventListener(removed);
        addedListenerNumber = category2.collection.added.numberOfListeners;
        removedListenerNumber = category2.collection.removed.numberOfListeners;
        replacedListenerNumber =
          category2.collection.replaced.numberOfListeners;
        categoryManager.remove('cat2', 'myOwner');
      });

      it('should destroy items', () => {
        expect(destroy).toHaveBeenCalled();
      });

      it('should call the removed event', () => {
        expect(removed).toHaveBeenCalled();
      });

      it('should remove the component id', () => {
        expect(categoryManager.componentIds).to.not.include('cat2');
      });

      it('should stop listen to the category.added event', () => {
        expect(category2.collection.added.numberOfListeners).to.be.equal(
          addedListenerNumber - 1,
        );
      });

      it('should stop listen to the category.removed event', () => {
        expect(category2.collection.removed.numberOfListeners).to.be.equal(
          removedListenerNumber - 1,
        );
      });

      it('should stop listen to the category.replaced event', () => {
        expect(category2.collection.replaced.numberOfListeners).to.be.equal(
          replacedListenerNumber - 1,
        );
      });
    });

    describe('removing a category with 2 owner', () => {
      let addedListenerNumber;
      let removedListenerNumber;
      let replacedListenerNumber;
      let removed;

      beforeAll(() => {
        removed = vi.fn();
        categoryManager.removed.addEventListener(removed);
        addedListenerNumber = category2.collection.added.numberOfListeners;
        removedListenerNumber = category2.collection.removed.numberOfListeners;
        replacedListenerNumber =
          category2.collection.replaced.numberOfListeners;
        categoryManager.remove('cat1', 'myOwner');
      });

      it('should not call the removed event', () => {
        expect(removed).not.toHaveBeenCalled();
      });

      it('should not remove the component id', () => {
        expect(categoryManager.componentIds).to.include('cat1');
      });

      it('should update the TreeViewItem actions array', () => {
        const cat1Item = categoryManager.get(category1.name);
        expect(cat1Item.actions).to.have.lengthOf(1);
      });

      it('should keep the listener on the category.added event', () => {
        expect(category2.collection.added.numberOfListeners).to.be.equal(
          addedListenerNumber,
        );
      });

      it('should keep the listener on the category.removed event', () => {
        expect(category2.collection.removed.numberOfListeners).to.be.equal(
          removedListenerNumber,
        );
      });

      it('should keep the listener on the category.replaced event', () => {
        expect(category2.collection.replaced.numberOfListeners).to.be.equal(
          replacedListenerNumber,
        );
      });
    });
  });

  describe('adding/removing MappingFunctions', () => {
    let categoryManager;
    let mappingFunctionTitleChange;
    let mappingFunctionActionsChange;
    let predicateFunctionItem1;
    let predicateFunctionNone;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
      );
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      predicateFunctionNone = () => {
        return false;
      };
      mappingFunctionTitleChange = (item, category, listItem) => {
        listItem.title = 'TITLETEST';
      };
      mappingFunctionActionsChange = (item, category, listItem) => {
        listItem.actions.push({ name: 'validAction', callback: () => {} });
      };
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should change the category items in the managed category', () => {
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionTitleChange,
        ['cat1'],
        'myOwner',
      );
      let categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].title).to.be.equal('TITLETEST');
      expect(categoryTreeViewItem.items[1].title).to.be.equal('item2');
      categoryManager.removeMappingFunction(
        mappingFunctionTitleChange,
        'myOwner',
      );
      categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].title).to.be.equal('item1');
    });

    it('should not change an item if the predicateFunction returns false', () => {
      categoryManager.addMappingFunction(
        predicateFunctionNone,
        mappingFunctionTitleChange,
        ['cat1'],
        'myOwner',
      );
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].title).to.be.equal('item1');
      categoryManager.removeMappingFunction(
        mappingFunctionTitleChange,
        'myOwner',
      );
    });

    it('should apply several MappingFunctions', () => {
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionTitleChange,
        ['cat1'],
        'myOwner',
      );
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionActionsChange,
        ['cat1'],
        'myOwner',
      );
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].title).to.be.equal('TITLETEST');
      expect(categoryTreeViewItem.items[0].actions).to.have.lengthOf(1);
      categoryManager.removeMappingFunction(
        mappingFunctionTitleChange,
        'myOwner',
      );
      categoryManager.removeMappingFunction(
        mappingFunctionActionsChange,
        'myOwner',
      );
    });

    it('should ignore invalid actions', () => {
      const invalidActionFunction = (item, category, listItem) => {
        listItem.actions.push({});
      };
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        invalidActionFunction,
        ['cat1'],
        'myOwner',
      );
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].actions).to.have.lengthOf(0);
      categoryManager.removeMappingFunction(invalidActionFunction, 'myOwner');
    });

    it('should destroy items, when setting a new mapping function', () => {
      const destroy = vi.fn();
      categoryManager.addMappingFunction(
        (i) => i.id === 'item3',
        (i, c, listItem) => {
          listItem.destroy = destroy;
          return listItem;
        },
        ['cat2'],
        'myOwner',
      );
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionTitleChange,
        ['cat2'],
        'myOwner',
      );
      expect(destroy).toHaveBeenCalled();
    });
  });

  describe('remove one owner of several for one category', () => {
    let categoryManager;
    let mappingFunctionTitleChange;
    let predicateFunctionItem1;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
      );
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      mappingFunctionTitleChange = (item, category, listItem) => {
        listItem.title = 'TITLETEST';
      };
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionTitleChange,
        ['cat1'],
        'myOwner2',
      );
      categoryManager.removeOwner('myOwner2');
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should not remove a category', () => {
      expect(categoryManager.componentIds).to.have.lengthOf(2);
      expect(categoryManager.componentIds).to.have.members(['cat1', 'cat2']);
    });

    it('should remove the mappingFunction', () => {
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.items[0].title).to.be.equal('item1');
    });

    it('should update the managed category', () => {
      const categoryTreeViewItem = categoryManager.get(category1.name);
      expect(categoryTreeViewItem.actions).to.have.lengthOf(1);
    });
  });

  describe('remove one owner', () => {
    let categoryManager;
    let mappingFunctionTitleChange;
    let predicateFunctionItem1;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
      );
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      mappingFunctionTitleChange = (item, category, listItem) => {
        listItem.title = 'TITLETEST';
      };
      categoryManager.addMappingFunction(
        predicateFunctionItem1,
        mappingFunctionTitleChange,
        ['cat1'],
        'myOwner2',
      );
      categoryManager.removeOwner('myOwner');
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should update the managed cateogries', () => {
      expect(categoryManager.componentIds).to.have.lengthOf(1);
      expect(categoryManager.componentIds).to.include('cat1');
    });
  });

  describe('dynamicModuleChanged', () => {
    let categoryManager;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat2',
          actions: [{ name: 'action2', callback: () => {} }],
        },
        'myOwner',
      );
      categoryManager.add(
        {
          categoryName: 'cat1',
          actions: [{ name: 'action3', callback: () => {} }],
        },
        'myOwner2',
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
        const listItemCat1 = categoryManager.get(category1.name);
        expect(listItemCat1.items).to.have.lengthOf(0);
        const listItemCat2 = categoryManager.get(category2.name);
        expect(listItemCat2.items).to.have.lengthOf(0);
      });

      it('should add newly added category items to the managed category list', () => {
        const item6 = { name: 'item6' };
        category1.collection.add(item6);
        const listItemCat1 = categoryManager.get(category1.name);
        expect(listItemCat1.items).to.have.lengthOf(1);
        category1.collection.remove(item6);
      });

      it('should update after resetting the dynamicModule', () => {
        app.resetDynamicModule();
        const listItemCat1 = categoryManager.get(category1.name);
        expect(listItemCat1.items).to.have.lengthOf(2);
        const listItemCat2 = categoryManager.get(category2.name);
        expect(listItemCat2.items).to.have.lengthOf(3);
      });

      it('should ignore removing an item from a module which is not the dynamicModule', () => {
        const item6 = { name: 'item6' };
        category1.collection.add(item6);
        app.resetDynamicModule();
        category1.collection.remove(item6);
        const listItemCat1 = categoryManager.get(category1.name);
        expect(listItemCat1.items).to.have.lengthOf(2);
        const listItemCat2 = categoryManager.get(category2.name);
        expect(listItemCat2.items).to.have.lengthOf(3);
      });
    });
  });

  describe('should order category actions by owner', () => {
    let categoryManager;
    let actions;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      app.plugins.add({ name: 'myOwner2' });
      app.plugins.add({ name: 'myOwner' });
      actions = [
        { name: 'action3', callback: () => {} },
        { name: 'action1', callback: () => {} },
      ];
      categoryManager.add(
        { categoryName: 'cat1', actions: [actions[1]] },
        'myOwner',
      );
      categoryManager.add(
        { categoryName: 'cat1', actions: [actions[0]] },
        'myOwner2',
      );
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should order actions correctly', () => {
      const listItemCat1 = categoryManager.get(category1.name);
      expect(listItemCat1.actions).to.have.ordered.members(actions);
    });
  });

  describe('removed category from the app', () => {
    let category3;
    let destroy;
    let categoryManager;

    beforeAll(async () => {
      category3 = await app.categories.requestCategory({
        name: 'cat3',
        type: 'Category',
      });
      await app.categories.parseCategoryItems(
        'cat3',
        [{ name: 'item1' }, { name: 'item2' }],
        app.dynamicModuleId,
      );
      categoryManager = new CategoryManager(app);
      categoryManager.add(
        {
          categoryName: 'cat3',
          actions: [{ name: 'action1', callback: () => {} }],
        },
        'myOwner',
      );
      destroy = vi.fn();
      categoryManager.addMappingFunction(
        () => true,
        (i, c, listItem) => {
          listItem.destroy = destroy;
          return listItem;
        },
        ['cat3'],
        'myOwner',
      );
      app.categories.remove(category3);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should update the managed category', () => {
      expect(categoryManager.componentIds).to.have.lengthOf(0);
    });

    it('should destroy any items created', () => {
      expect(destroy).toHaveBeenCalled();
    });
  });
});
