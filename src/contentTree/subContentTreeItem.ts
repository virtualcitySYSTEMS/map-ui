import type VcsUiApp from '../vcsUiApp.js';
import ContentTreeItem, {
  type ContentTreeItemOptions,
  type TreeViewItem,
  contentTreeClassRegistry,
  subTreeSymbol,
} from './contentTreeItem.js';

/**
 * A subtree item. Subtrees are rendered in their own (not the main content tree).
 * They will receive their own toggle button in the nav bar.
 * Only toplevel items can be content tree items (with a name which does not have a .)
 */
class SubContentTreeItem extends ContentTreeItem {
  static get className(): string {
    return 'SubContentTreeItem';
  }

  constructor(options: ContentTreeItemOptions, app: VcsUiApp) {
    super(options, app);

    if (!this.name || this.name.split('.').length > 1) {
      throw new Error(
        `Sub trees may only be defined on top level. Tree ${this.name} is nested or undefined`,
      );
    }
    this.clickable = false;
  }

  getTreeViewItem(): TreeViewItem {
    const treeViewItem = super.getTreeViewItem();
    treeViewItem[subTreeSymbol] = true;
    return treeViewItem;
  }
}

export default SubContentTreeItem;
contentTreeClassRegistry.registerClass(
  SubContentTreeItem.className,
  SubContentTreeItem,
);
