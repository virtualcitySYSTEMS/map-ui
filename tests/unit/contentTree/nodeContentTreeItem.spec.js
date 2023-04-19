import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import NodeContentTreeItem from '../../../src/contentTree/nodeContentTreeItem.js';
import ContentTreeItem from '../../../src/contentTree/contentTreeItem.js';
import VcsUiApp from '../../../src/vcsUiApp.js';
import { sleep } from '../../helpers.js';

describe('GroupContentTreeItem', () => {
  let app;
  function setupNodeItem() {
    const item = new NodeContentTreeItem({ name: 'foo' }, app);
    const childrenArray = item.getTreeViewItem().children;
    const children = [
      new ContentTreeItem({ name: 'foo.bar' }, app),
      new ContentTreeItem({ name: 'foo.bar' }, app),
      new ContentTreeItem({ name: 'foo.bar' }, app),
    ];

    childrenArray.push(...children.map((c) => c.getTreeViewItem()));

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
      ({ item, children } = setupNodeItem());
      children.forEach((c) => {
        c.visible = false;
      });
    });

    afterAll(() => {
      item.destroy();
      children.forEach((c) => {
        c.destroy();
      });
    });

    it('should be visible, if a single child is visible', async () => {
      children[0].visible = true;
      await sleep();
      expect(item.visible).to.be.true;
    });

    it('should be invisible, if all children are not visible', async () => {
      children.forEach((c) => {
        c.visible = false;
      });
      await sleep();
      expect(item.visible).to.be.false;
    });
  });
});
