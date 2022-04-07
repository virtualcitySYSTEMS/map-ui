import ContentTreeItem, { contentTreeClassRegistry } from './contentTreeItem.js';

/**
 * @type {symbol}
 */
export const subTreeSymbol = Symbol('SubTree');

/**
 * A sub tree item. Subtrees are rendered in their own (not the main content tree).
 * They will receive their own toggle button in the nav bar.
 * Only toplevel items can be content tree items (with a name which does not have a .)
 * @class
 * @extends {ContentTreeItem}
 */
class SubContentTreeItem extends ContentTreeItem {
  static get className() { return 'SubContentTreeItem'; }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    if (!this.name || this.name.split('.').length > 1) {
      throw new Error(`Sub trees may only be defined on top level. Tree ${this.name} is nested or undefined`);
    }
    this.clickable = false;
  }

  /**
   * @returns {TreeViewItem}
   */
  getTreeViewItem() {
    const treeViewItem = super.getTreeViewItem();
    treeViewItem[subTreeSymbol] = true;
    return treeViewItem;
  }
}

export default SubContentTreeItem;
contentTreeClassRegistry.registerClass(SubContentTreeItem.className, SubContentTreeItem);
