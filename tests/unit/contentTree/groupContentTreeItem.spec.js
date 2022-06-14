import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  vi,
} from 'vitest';
import GroupContentTreeItem from '../../../src/contentTree/groupContentTreeItem.js';
import ContentTreeItem from '../../../src/contentTree/contentTreeItem.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { StateActionState } from '../../../src/actions/stateRefAction.js';
import { sleep } from '../../helpers.js';

describe('GroupContentTreeItem', () => {
  let app;
  function setupGroupItem() {
    const item = new GroupContentTreeItem({ name: 'foo' }, app);
    const childrenArray = item.getTreeViewItem().children;
    const children = [
      new ContentTreeItem({ name: 'foo.bar' }, app),
      new ContentTreeItem({ name: 'foo.bar' }, app),
      new ContentTreeItem({ name: 'foo.bar' }, app),
    ];

    childrenArray.push(...children.map(c => c.getTreeViewItem()));

    return { item, children };
  }

  beforeAll(() => {
    app = new VcsUiApp();
  });

  afterAll(() => {
    app.destroy();
  });

  describe('visibility', () => {
    let item;
    let children;

    beforeAll(() => {
      ({ item, children } = setupGroupItem());
      children.forEach((c) => { c.visible = false; });
    });

    afterAll(() => {
      item.destroy();
      children.forEach((c) => { c.destroy(); });
    });

    it('should be visible, if a single child is visible', async () => {
      children[0].visible = true;
      await sleep();
      expect(item.visible).to.be.true;
    });

    it('should be invisible, if all children are not visible', async () => {
      children.forEach((c) => { c.visible = false; });
      await sleep();
      expect(item.visible).to.be.false;
    });
  });

  describe('state', () => {
    let item;
    let children;

    beforeAll(() => {
      ({ item, children } = setupGroupItem());
      children.forEach((c) => { c.state = StateActionState.NONE; });
    });

    afterAll(() => {
      item.destroy();
      children.forEach((c) => { c.destroy(); });
    });

    it('should have a state of NONE, if all items have a state of NONE', async () => {
      children.forEach((c) => { c.state = StateActionState.NONE; });
      await sleep();
      expect(item.state).to.equal(StateActionState.NONE);
    });

    it('should have a state of ACTIVE, if all items without a state of NONE are ACTIVE', async () => {
      children[0].state = StateActionState.ACTIVE;
      children[1].state = StateActionState.ACTIVE;
      await sleep();
      expect(item.state).to.equal(StateActionState.ACTIVE);
    });

    it('should have a state of INACTIVE, if all items without a state of NONE are INACTIVE', async () => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.INACTIVE;
      await sleep();
      expect(item.state).to.equal(StateActionState.INACTIVE);
    });

    it('should have a state of INDETERMINATE, if all items without a state of NONE have differing states', async () => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.LOADING;
      await sleep();
      expect(item.state).to.equal(StateActionState.INDETERMINATE);
    });
  });

  describe('click behavior', () => {
    let item;
    let spies;
    let children;

    beforeEach(() => {
      ({ item, children } = setupGroupItem());
      children.forEach((c) => { c.state = StateActionState.NONE; });
      spies = item.getTreeViewItem().children.map(c => vi.spyOn(c, 'clicked'));
    });

    afterEach(() => {
      item.destroy();
      children.forEach((c) => { c.destroy(); });
    });

    it('should click all visible children with a state not NONE, if the group is ACTIVE', async () => {
      children[0].state = StateActionState.ACTIVE;
      children[1].state = StateActionState.ACTIVE;
      children[2].state = StateActionState.ACTIVE;
      children[2].visible = false;
      await sleep();
      await item.clicked();
      expect(spies[0]).toHaveBeenCalled();
      expect(spies[1]).toHaveBeenCalled();
      expect(spies[2]).not.toHaveBeenCalled();
    });

    it('should click all visible children with a state not NONE and not ACTIVE, if the group is not active', async () => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.ACTIVE;
      children[2].state = StateActionState.INACTIVE;
      children[2].visible = false;
      await sleep();
      await item.clicked();
      expect(spies[0]).toHaveBeenCalled();
      expect(spies[1]).not.toHaveBeenCalled();
      expect(spies[2]).not.toHaveBeenCalled();
    });

    it('should not click any children, if the group has a state of NONE', async () => {
      children[0].state = StateActionState.NONE;
      children[1].state = StateActionState.NONE;
      children[2].state = StateActionState.NONE;
      children[2].visible = false;
      await sleep();
      await item.clicked();
      expect(spies[0]).not.toHaveBeenCalled();
      expect(spies[1]).not.toHaveBeenCalled();
      expect(spies[2]).not.toHaveBeenCalled();
    });
  });
});
