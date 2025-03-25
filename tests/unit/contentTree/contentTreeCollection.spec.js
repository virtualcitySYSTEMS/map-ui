import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from 'vitest';
import ContentTreeItem from '../../../src/contentTree/contentTreeItem.js';
import SubContentTreeItem from '../../../src/contentTree/subContentTreeItem.js';
import VcsUiApp from '../../../src/vcsUiApp.js';

/**
 * @param {ContentTreeItemOptions} options
 * @param {VcsUiApp} app
 * @returns {ContentTreeItem}
 */
function createVisibleContentTreeItem(options, app) {
  const item = new ContentTreeItem(options, app);
  item.visible = true;
  return item;
}

describe('ContentTreeCollection', () => {
  describe('creating a normal tree', () => {
    let app;
    let collection;
    let tree;
    let id;

    beforeAll(() => {
      app = new VcsUiApp();
      collection = app.contentTree;
      [
        { name: 'base' },
        { name: 'base.foo' },
        { name: 'base.bar', weight: -1 },
        { name: 'base.bar.foo' },
        { name: 'base.baz', weight: 1 },
        { name: 'foo' },
        { name: 'no.parent' },
      ].forEach((options) => {
        collection.add(createVisibleContentTreeItem(options, app));
      });
      [id] = collection.subTreeIds;
      tree = collection.getComputedVisibleTree(id).value;
    });

    afterAll(() => {
      app.destroy();
    });

    it('should create an array of top level items', () => {
      expect(tree).to.have.lengthOf(2);
    });

    it('should create children of items with a parent', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      expect(baseItem).to.have.property('children').and.to.have.lengthOf(3);
    });

    it('should create nested children', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      const barItem = baseItem.children.find((i) => i.name === 'base.bar');
      expect(barItem).to.have.property('children').and.to.have.lengthOf(1);
    });

    it('should respect weights', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      expect(baseItem.children[0]).to.have.property('name', 'base.baz');
      expect(baseItem.children[2]).to.have.property('name', 'base.bar');
    });

    it('should return the children of a subTree', () => {
      const children = collection.getChildrenForSubTree(id);
      expect(children).to.have.lengthOf(7);
    });

    it('should add a navbar action', () => {
      expect(app.navbarManager.componentIds).to.have.ordered.members(
        collection.subTreeIds,
      );
    });
  });

  describe('creating a tree with subtrees', () => {
    let app;
    let collection;
    let tree;
    let subTree1;
    let subTree2;
    let id;
    let subTreeId1;
    let subTreeId2;

    beforeAll(() => {
      app = new VcsUiApp();
      collection = app.contentTree;
      [
        { name: 'base' },
        { name: 'base.foo' },
        { name: 'base.bar', weight: -1 },
        { name: 'base.bar.foo' },
        { name: 'base.baz', weight: 1 },
        { name: 'foo' },
        { name: 'no.parent' },
      ].forEach((options) => {
        collection.add(createVisibleContentTreeItem(options, app));
      });
      collection.add(new SubContentTreeItem({ name: 'sub' }, app));
      collection.add(createVisibleContentTreeItem({ name: 'sub.base' }, app));
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.bar', weight: 1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.foo', weight: -1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.bar' }, app),
      );
      collection.add(
        new SubContentTreeItem({ name: 'otherSub', weight: 1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'otherSub.base' }, app),
      );
      [id, subTreeId1, subTreeId2] = collection.subTreeIds;
      tree = collection.getComputedVisibleTree(id).value;
      subTree1 = collection.getComputedVisibleTree(subTreeId1).value;
      subTree2 = collection.getComputedVisibleTree(subTreeId2).value;
    });

    afterAll(() => {
      app.destroy();
    });

    it('should create an array of top level items', () => {
      expect(tree).to.have.lengthOf(2);
      expect(subTree1).to.have.lengthOf(1);
      expect(subTree2).to.have.lengthOf(2);
    });

    it('should create children of items with a parent', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      expect(baseItem).to.have.property('children').and.to.have.lengthOf(3);
      const subBaseItem = subTree2.find((i) => i.name === 'sub.base');
      expect(subBaseItem).to.have.property('children').and.to.have.lengthOf(2);
    });

    it('should create nested children', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      const barItem = baseItem.children.find((i) => i.name === 'base.bar');
      expect(barItem).to.have.property('children').and.to.have.lengthOf(1);
    });

    it('should respect weights', () => {
      const baseItem = tree.find((i) => i.name === 'base');
      expect(baseItem.children[0]).to.have.property('name', 'base.baz');
      expect(baseItem.children[2]).to.have.property('name', 'base.bar');
      expect(subTree2[0]).to.have.property('name', 'sub.bar');
      expect(subTree2[1]).to.have.property('name', 'sub.base');
    });

    it('should return the children of a subTree', () => {
      const children = collection.getChildrenForSubTree(id);
      expect(children).to.have.lengthOf(7);
      const subChildren = collection.getChildrenForSubTree(subTreeId2);
      expect(subChildren).to.have.lengthOf(5);
    });

    it('should add a navbar action', () => {
      expect(app.navbarManager.componentIds).to.have.members(
        collection.subTreeIds,
      );
    });
  });

  describe('getting the open state', () => {
    let app;
    let collection;
    let id;
    let subTreeId;

    beforeAll(() => {
      app = new VcsUiApp();
      collection = app.contentTree;
      [
        { name: 'base', initOpen: true },
        { name: 'base.foo' },
        { name: 'base.bar', weight: -1 },
        { name: 'base.bar.foo' },
        { name: 'base.baz', weight: 1 },
        { name: 'foo', initOpen: true },
        { name: 'no.parent' },
      ].forEach((options) => {
        collection.add(createVisibleContentTreeItem(options, app));
      });
      collection.add(new SubContentTreeItem({ name: 'sub' }, app));
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base', initOpen: true }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.bar', weight: 1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.foo', weight: -1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.bar' }, app),
      );
      [id, subTreeId] = collection.subTreeIds;
    });

    afterAll(() => {
      app.destroy();
    });

    it('should return the default trees open state', () => {
      expect(collection.getTreeOpenState(id)).to.have.members(['base', 'foo']);
    });

    it('should return the sub trees open state', () => {
      expect(collection.getTreeOpenState(subTreeId)).to.have.members([
        'sub.base',
      ]);
    });

    it('should always return the same reference', () => {
      const first = collection.getTreeOpenState(id);
      const second = collection.getTreeOpenState(id);
      expect(first).to.equal(second);
    });

    it('should apply the init open state, even if the item is added before the subtree item', () => {
      collection.add(createVisibleContentTreeItem({ name: 'sub.base' }, app));
      collection.add(new SubContentTreeItem({ name: 'sub' }, app));
      const openState = collection.getTreeOpenState('sub');
      expect(openState).to.have.members(['sub.base']);
    });
  });

  describe('reacting to collection & item changes', () => {
    let app;
    let collection;

    beforeEach(() => {
      app = new VcsUiApp();
      collection = app.contentTree;
      [
        { name: 'base' },
        { name: 'base.foo' },
        { name: 'base.bar', weight: -1 },
        { name: 'base.bar.foo' },
        { name: 'base.baz', weight: 1 },
        { name: 'foo' },
        { name: 'no.parent' },
      ].forEach((options) => {
        collection.add(createVisibleContentTreeItem(options, app));
      });
      collection.add(new SubContentTreeItem({ name: 'sub' }, app));
      collection.add(createVisibleContentTreeItem({ name: 'sub.base' }, app));
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.bar', weight: 1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.foo', weight: -1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.bar' }, app),
      );
    });

    afterEach(() => {
      app.destroy();
    });

    it('should recreate the tree if an item is added', () => {
      collection.add(createVisibleContentTreeItem({ name: 'baz' }), app);
      collection.add(createVisibleContentTreeItem({ name: 'sub.foo' }), app);
      const [id, subTreeId] = collection.subTreeIds;
      const tree = collection.getComputedVisibleTree(id).value;
      expect(tree).to.have.lengthOf(3);
      expect(tree[2]).to.have.property('name', 'baz');

      const subTree = collection.getComputedVisibleTree(subTreeId).value;
      expect(subTree).to.have.lengthOf(3);
      expect(subTree[2]).to.have.property('name', 'sub.foo');
    });

    it('should recreate the tree if an item was overridden', () => {
      collection.override(
        createVisibleContentTreeItem({ name: 'base', title: 'foo' }, app),
      );
      collection.override(
        createVisibleContentTreeItem({ name: 'sub.bar' }, app),
      );
      const [id, subTreeId] = collection.subTreeIds;

      const tree = collection.getComputedVisibleTree(id).value;
      expect(tree[0]).to.have.property('title', 'foo');

      const subTree = collection.getComputedVisibleTree(subTreeId).value;
      expect(subTree).to.have.lengthOf(2);
      expect(subTree[0]).to.have.property('name', 'sub.base');
    });

    it('should recreate the tree if an item is removed', () => {
      const foo = collection.getByKey('foo');
      const subFoo = collection.getByKey('sub.base.foo');

      collection.remove(foo);
      collection.remove(subFoo);

      const [id, subTreeId] = collection.subTreeIds;

      const tree = collection.getComputedVisibleTree(id).value;
      expect(tree).to.have.lengthOf(1);

      const subTree = collection.getComputedVisibleTree(subTreeId).value;
      const subBase = subTree.find((i) => i.name === 'sub.base');
      expect(subBase.children).to.have.lengthOf(1);
    });

    it('should recreate the tree if a subtree is removed', () => {
      const subTree = collection.getByKey('sub');
      collection.remove(subTree);
      expect(collection.subTreeIds).to.have.lengthOf(1);
    });
  });

  describe('reacting to weight changes', () => {
    let app;
    let collection;

    beforeEach(() => {
      app = new VcsUiApp();
      collection = app.contentTree;
      [
        { name: 'base' },
        { name: 'base.foo' },
        { name: 'base.bar', weight: -1 },
        { name: 'base.bar.foo' },
        { name: 'base.baz', weight: 1 },
        { name: 'foo' },
        { name: 'no.parent' },
      ].forEach((options) => {
        collection.add(createVisibleContentTreeItem(options, app));
      });
      collection.add(new SubContentTreeItem({ name: 'sub' }, app));
      collection.add(createVisibleContentTreeItem({ name: 'sub.base' }, app));
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.bar', weight: 1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.foo', weight: -1 }, app),
      );
      collection.add(
        createVisibleContentTreeItem({ name: 'sub.base.bar' }, app),
      );
    });

    afterEach(() => {
      app.destroy();
    });

    it('should recreate the tree if the weight to an item changes', () => {
      const foo = collection.getByKey('foo');
      const subFoo = collection.getByKey('sub.base.foo');

      foo.weight = 1;
      subFoo.weight = 2;

      const [id, subTreeId] = collection.subTreeIds;

      const tree = collection.getComputedVisibleTree(id).value;
      expect(tree[0]).to.have.property('name', 'foo');

      const subTree = collection.getComputedVisibleTree(subTreeId).value;
      const subBase = subTree.find((i) => i.name === 'sub.base');
      expect(subBase.children[0]).to.have.property('name', 'sub.base.foo');
    });

    it('should no longer recreate the tree, if the item was removed', () => {
      const foo = collection.getByKey('foo');
      collection.remove(foo);
      const [id] = collection.subTreeIds;
      const tree = collection.getComputedVisibleTree(id).value;

      foo.weight = 1;
      const treeAfter = collection.getComputedVisibleTree(id).value;
      expect(tree).to.equal(treeAfter);
    });
  });
});
