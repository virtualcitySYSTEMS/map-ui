import {
  describe,
  expect,
  it,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { Context } from '@vcmap/core';
import VcsUiApp from '../../../src/vcsUiApp.js';
import CategoryManager from '../../../src/manager/categoryManager/categoryManager.js';


describe('categoryManager', () => {
  let app;
  let category1;
  let category2;

  beforeAll(async () => {
    app = new VcsUiApp();
    category1 = await app.categories.requestCategory({ name: 'cat1', type: 'Category' });
    category2 = await app.categories.requestCategory({ name: 'cat2', type: 'Category', keyProperty: 'id' });
    await app.categories.parseCategoryItems(
      'cat1',
      [{ name: 'item1' }, { name: 'item2' }],
      app.dynamicContextId,
    );
    await app.categories.parseCategoryItems(
      'cat2',
      [{ id: 'item3' }, { id: 'item4' }, { id: 'item5' }],
      app.dynamicContextId,
    );
  });

  afterAll(() => {
    app.destroy();
  });

  describe('adding Categories', () => {
    let categoryManager;


    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should add both categories to the treeViewItems', () => {
      expect(categoryManager.items.value.length).to.be.equal(2);
    });

    it('should set the title of the category in treeViewItems', () => {
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem).to.not.be.null;
      expect(categoryTreeViewItem.title).to.equal(category1.name);
    });

    it('should merge the actions in the items with several owners', () => {
      const cat1Item = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(cat1Item.actions).to.have.lengthOf(2);
    });

    it('should set the actions in the treeViewItems', () => {
      const cat2Item = categoryManager.items.value.find((item) => { return item.id === category2.name; });
      expect(cat2Item.actions).to.have.lengthOf(1);
    });

    describe('category Items', () => {
      let cat1Item;
      let cat2Item;

      beforeAll(() => {
        cat1Item = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        cat2Item = categoryManager.items.value.find((item) => { return item.id === category2.name; });
      });

      it('should add the category items in the treeViewItems', () => {
        expect(cat1Item.children).to.have.lengthOf(2);
        expect(cat2Item.children).to.have.lengthOf(3);
      });

      it('should set the id property on the category items in the treeViewItems', () => {
        expect(cat1Item.children[0].id).to.be.equal('item1');
        expect(cat2Item.children[0].id).to.be.equal('item3');
      });

      it('should set the title property on the category items in the treeViewItems', () => {
        expect(cat1Item.children[0].title).to.be.equal('item1');
        expect(cat2Item.children[0].title).to.be.equal('item3');
      });

      it('should update items list on adding/removing new Items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem);
        expect(cat1Item.children).to.have.lengthOf(3);
        expect(cat1Item.children[2].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.children).to.have.lengthOf(2);
      });

      it('should respect the order of added new Items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem, 0);
        expect(cat1Item.children).to.have.lengthOf(3);
        expect(cat1Item.children[0].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.children).to.have.lengthOf(2);
      });

      it('should respect the order of added new Items in between existing Items to the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem, 1);
        expect(cat1Item.children).to.have.lengthOf(3);
        expect(cat1Item.children[1].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
        expect(cat1Item.children).to.have.lengthOf(2);
      });

      it('should handle moving of Items in the category', () => {
        const newItem = { name: 'itemNew' };
        category1.collection.add(newItem);
        expect(cat1Item.children).to.have.lengthOf(3);
        expect(cat1Item.children[2].id).to.be.equal('itemNew');
        category1.collection.lower(newItem, 2);
        expect(cat1Item.children[0].id).to.be.equal('itemNew');
        category1.collection.raise(newItem, 1);
        expect(cat1Item.children[1].id).to.be.equal('itemNew');
        category1.collection.remove(newItem);
      });

      it('should ignore newly added Items not associated to the dynamicContext', async () => {
        expect(cat1Item.children).to.have.lengthOf(2);
        const newContext = new Context({});
        await app.addContext(newContext);
        await app.categories.parseCategoryItems(
          'cat1',
          [{ name: 'item7' }, { name: 'item8' }],
          newContext.id,
        );
        expect(cat1Item.children).to.have.lengthOf(2);
        await app.removeContext(newContext.id);
      });
    });
  });

  describe('removing Categories', () => {
    let categoryManager;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    describe('removing a category with only 1 owner', () => {
      let addedListenerNumber;
      let removedListenerNumber;
      let replacedListenerNumber;

      beforeAll(() => {
        addedListenerNumber = category2.collection.added.numberOfListeners;
        removedListenerNumber = category2.collection.removed.numberOfListeners;
        replacedListenerNumber = category2.collection.replaced.numberOfListeners;
        categoryManager.removeCategory('cat2', 'myOwner');
      });

      it('should remove the Category TreeViewItem', () => {
        expect(categoryManager.items.value).to.have.lengthOf(1);
      });

      it('should stop listen to the category.added event', () => {
        expect(category2.collection.added.numberOfListeners).to.be.equal(addedListenerNumber - 1);
      });

      it('should stop listen to the category.removed event', () => {
        expect(category2.collection.removed.numberOfListeners).to.be.equal(removedListenerNumber - 1);
      });

      it('should stop listen to the category.replaced event', () => {
        expect(category2.collection.replaced.numberOfListeners).to.be.equal(replacedListenerNumber - 1);
      });
    });

    describe('removing a category with only 2 owner', () => {
      let addedListenerNumber;
      let removedListenerNumber;
      let replacedListenerNumber;

      beforeAll(() => {
        addedListenerNumber = category2.collection.added.numberOfListeners;
        removedListenerNumber = category2.collection.removed.numberOfListeners;
        replacedListenerNumber = category2.collection.replaced.numberOfListeners;
        categoryManager.removeCategory('cat1', 'myOwner');
      });

      it('should update the TreeViewItem actions array', () => {
        const cat1Item = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        expect(cat1Item.actions).to.have.lengthOf(1);
      });

      it('should keep the listener on the category.added event', () => {
        expect(category2.collection.added.numberOfListeners).to.be.equal(addedListenerNumber);
      });

      it('should keep the listener on the category.removed event', () => {
        expect(category2.collection.removed.numberOfListeners).to.be.equal(removedListenerNumber);
      });

      it('should keep the listener on the category.replaced event', () => {
        expect(category2.collection.replaced.numberOfListeners).to.be.equal(replacedListenerNumber);
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
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      predicateFunctionNone = () => {
        return false;
      };
      mappingFunctionTitleChange = (item, category, treeViewItem) => {
        treeViewItem.title = 'TITLETEST';
      };
      mappingFunctionActionsChange = (item, category, treeViewItem) => {
        treeViewItem.actions.push({ name: 'validAction', callback: () => {} });
      };
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should change the Category Items in the treeViewItems', () => {
      categoryManager.addMappingFunction(predicateFunctionItem1, mappingFunctionTitleChange, ['cat1'], 'myOwner');
      let categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].title).to.be.equal('TITLETEST');
      expect(categoryTreeViewItem.children[1].title).to.be.equal('item2');
      categoryManager.removeMappingFunction(mappingFunctionTitleChange, 'myOwner');
      categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].title).to.be.equal('item1');
    });

    it('should not change an item if the predicateFunction returns false', () => {
      categoryManager.addMappingFunction(predicateFunctionNone, mappingFunctionTitleChange, ['cat1'], 'myOwner');
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].title).to.be.equal('item1');
      categoryManager.removeMappingFunction(mappingFunctionTitleChange, 'myOwner');
    });

    it('should apply several MappingFunctions', () => {
      categoryManager.addMappingFunction(predicateFunctionItem1, mappingFunctionTitleChange, ['cat1'], 'myOwner');
      categoryManager.addMappingFunction(predicateFunctionItem1, mappingFunctionActionsChange, ['cat1'], 'myOwner');
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].title).to.be.equal('TITLETEST');
      expect(categoryTreeViewItem.children[0].actions).to.have.lengthOf(1);
      categoryManager.removeMappingFunction(mappingFunctionTitleChange, 'myOwner');
      categoryManager.removeMappingFunction(mappingFunctionActionsChange, 'myOwner');
    });

    it('should ignore invalid actions', () => {
      const invalidActionFunction = (item, category, treeViewItem) => {
        treeViewItem.actions.push({ });
      };
      categoryManager.addMappingFunction(predicateFunctionItem1, invalidActionFunction, ['cat1'], 'myOwner');
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].actions).to.have.lengthOf(0);
      categoryManager.removeMappingFunction(invalidActionFunction, 'myOwner');
    });
  });

  describe('remove one owner of several for one category', () => {
    let categoryManager;
    let mappingFunctionTitleChange;
    let predicateFunctionItem1;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      mappingFunctionTitleChange = (item, category, treeViewItem) => {
        treeViewItem.title = 'TITLETEST';
      };
      categoryManager.addMappingFunction(predicateFunctionItem1, mappingFunctionTitleChange, ['cat1'], 'myOwner2');
      categoryManager.removeOwner('myOwner2');
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should not remove a category', () => {
      expect(categoryManager.items.value).to.have.lengthOf(2);
    });

    it('should remove the mappingFunction', () => {
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.children[0].title).to.be.equal('item1');
    });

    it('should update the Category TreeViewItem', () => {
      const categoryTreeViewItem = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(categoryTreeViewItem.actions).to.have.lengthOf(1);
    });
  });

  describe('remove one owner', () => {
    let categoryManager;
    let mappingFunctionTitleChange;
    let predicateFunctionItem1;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
      predicateFunctionItem1 = (item) => {
        return item.name === 'item1';
      };
      mappingFunctionTitleChange = (item, category, treeViewItem) => {
        treeViewItem.title = 'TITLETEST';
      };
      categoryManager.addMappingFunction(predicateFunctionItem1, mappingFunctionTitleChange, ['cat1'], 'myOwner2');
      categoryManager.removeOwner('myOwner');
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should update treeViewItems', () => {
      expect(categoryManager.items.value).to.have.lengthOf(1);
    });
  });

  describe('dynamicContextChanged', () => {
    let categoryManager;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat1', 'myOwner', [{ name: 'action1', callback: () => {} }]);
      categoryManager.addCategory('cat2', 'myOwner', [{ name: 'action2', callback: () => {} }]);
      categoryManager.addCategory('cat1', 'myOwner2', [{ name: 'action3', callback: () => {} }]);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    describe('should filter ', () => {
      let context;
      beforeEach(async () => {
        context = new Context({});
        await app.addContext(context);
        app.setDynamicContext(context);
      });

      afterEach(async () => {
        app.resetDynamicContext();
        await app.removeContext(context.id);
      });

      it('should synchronize the Category Items in the treeViewItems list', () => {
        const treeViewItemCat1 = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        expect(treeViewItemCat1.children).to.have.lengthOf(0);
        const treeViewItemCat2 = categoryManager.items.value.find((item) => { return item.id === category2.name; });
        expect(treeViewItemCat2.children).to.have.lengthOf(0);
      });

      it('should add newly added Category items to the treeViewItems list', () => {
        const item6 = { name: 'item6' };
        category1.collection.add(item6);
        const treeViewItemCat1 = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        expect(treeViewItemCat1.children).to.have.lengthOf(1);
        category1.collection.remove(item6);
      });

      it('should update after resetting the dynamicContext', () => {
        app.resetDynamicContext();
        const treeViewItemCat1 = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        expect(treeViewItemCat1.children).to.have.lengthOf(2);
        const treeViewItemCat2 = categoryManager.items.value.find((item) => { return item.id === category2.name; });
        expect(treeViewItemCat2.children).to.have.lengthOf(3);
      });

      it('should ignore removing an Item from a context which is not the dynamicContext', () => {
        const item6 = { name: 'item6' };
        category1.collection.add(item6);
        app.resetDynamicContext();
        category1.collection.remove(item6);
        const treeViewItemCat1 = categoryManager.items.value.find((item) => { return item.id === category1.name; });
        expect(treeViewItemCat1.children).to.have.lengthOf(2);
        const treeViewItemCat2 = categoryManager.items.value.find((item) => { return item.id === category2.name; });
        expect(treeViewItemCat2.children).to.have.lengthOf(3);
      });
    });
  });

  describe('should order Category actions by owner', () => {
    let categoryManager;
    let actions;

    beforeAll(() => {
      categoryManager = new CategoryManager(app);
      app.plugins.add({ name: 'myOwner2' });
      app.plugins.add({ name: 'myOwner' });
      actions = [{ name: 'action3', callback: () => {} }, { name: 'action1', callback: () => {} }];
      categoryManager.addCategory('cat1', 'myOwner', [actions[1]]);
      categoryManager.addCategory('cat1', 'myOwner2', [actions[0]]);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should order actions correctly', () => {
      const treeViewItemCat1 = categoryManager.items.value.find((item) => { return item.id === category1.name; });
      expect(treeViewItemCat1.actions).to.have.ordered.members(actions);
    });
  });

  describe('removed Category from the app', () => {
    let category3;
    let categoryManager;

    beforeAll(async () => {
      category3 = await app.categories.requestCategory({ name: 'cat3', type: 'Category' });
      await app.categories.parseCategoryItems(
        'cat3',
        [{ name: 'item1' }, { name: 'item2' }],
        app.dynamicContextId,
      );
      categoryManager = new CategoryManager(app);
      categoryManager.addCategory('cat3', 'myOwner', [{ name: 'action1', callback: () => {} }]);
    });

    afterAll(() => {
      categoryManager.destroy();
    });

    it('should update the treeViewItems', () => {
      expect(categoryManager.items.value).to.have.lengthOf(1);
      app.categories.remove(category3);
      expect(categoryManager.items.value).to.have.lengthOf(0);
    });
  });
});
