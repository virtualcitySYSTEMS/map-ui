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

    it('should be visible, if a single child is visible', (done) => {
      children[0].visible = true;
      setTimeout(() => {
        expect(item.visible).to.be.true;
        done();
      }, 0);
    });

    it('should be invisible, if all children are not visible', (done) => {
      children.forEach((c) => { c.visible = false; });
      setTimeout(() => {
        expect(item.visible).to.be.false;
        done();
      }, 0);
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

    it('should have a state of NONE, if all items have a state of NONE', (done) => {
      children.forEach((c) => { c.state = StateActionState.NONE; });
      setTimeout(() => {
        expect(item.state).to.equal(StateActionState.NONE);
        done();
      });
    });

    it('should have a state of ACTIVE, if all items without a state of NONE are ACTIVE', (done) => {
      children[0].state = StateActionState.ACTIVE;
      children[1].state = StateActionState.ACTIVE;
      setTimeout(() => {
        expect(item.state).to.equal(StateActionState.ACTIVE);
        done();
      }, 0);
    });

    it('should have a state of INACTIVE, if all items without a state of NONE are INACTIVE', (done) => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.INACTIVE;
      setTimeout(() => {
        expect(item.state).to.equal(StateActionState.INACTIVE);
        done();
      }, 0);
    });

    it('should have a state of INDETERMINATE, if all items without a state of NONE have differing states', (done) => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.LOADING;
      setTimeout(() => {
        expect(item.state).to.equal(StateActionState.INDETERMINATE);
        done();
      }, 0);
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

    it('should click all visible children with a state not NONE, if the group is ACTIVE', (done) => {
      children[0].state = StateActionState.ACTIVE;
      children[1].state = StateActionState.ACTIVE;
      children[2].state = StateActionState.ACTIVE;
      children[2].visible = false;
      setTimeout(async () => {
        await item.clicked();
        expect(spies[0]).toHaveBeenCalled();
        expect(spies[1]).toHaveBeenCalled();
        expect(spies[2]).not.toHaveBeenCalled();
        done();
      });
    });

    it('should click all visible children with a state not NONE and not ACTIVE, if the group is not active', (done) => {
      children[0].state = StateActionState.INACTIVE;
      children[1].state = StateActionState.ACTIVE;
      children[2].state = StateActionState.INACTIVE;
      children[2].visible = false;
      setTimeout(async () => {
        await item.clicked();
        expect(spies[0]).toHaveBeenCalled();
        expect(spies[1]).not.toHaveBeenCalled();
        expect(spies[2]).not.toHaveBeenCalled();
        done();
      });
    });

    it('should not click any children, if the group has a state of NONE', (done) => {
      children[0].state = StateActionState.NONE;
      children[1].state = StateActionState.NONE;
      children[2].state = StateActionState.NONE;
      children[2].visible = false;
      setTimeout(async () => {
        await item.clicked();
        expect(spies[0]).not.toHaveBeenCalled();
        expect(spies[1]).not.toHaveBeenCalled();
        expect(spies[2]).not.toHaveBeenCalled();
        done();
      });
    });
  });
});
