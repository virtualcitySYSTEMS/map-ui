import AbstractTreeViewItem from './AbstractTreeViewItem.js';

class GroupTreeViewItem extends AbstractTreeViewItem {
  /**
   * @todo this has to be refactored, just so we can read the config as is
   * @returns {string}
   */
  static get className() { return 'vcs.vcm.widgets.legend.GroupItem'; }

  // TODO track state of items

  async clicked() {
    await Promise.all(this.items.map(c => c.clicked()));
  }
}

export default GroupTreeViewItem;
