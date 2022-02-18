import AbstractTreeViewItem from './AbstractTreeViewItem.js';

class NodeTreeViewItem extends AbstractTreeViewItem {
  /**
   * @todo this has to be refactored, just so we can read the config as is
   * @returns {string}
   */
  static get className() { return 'vcs.vcm.widgets.legend.ClusterItem'; }

  constructor(context, options) {
    super(context, options);

    this.clickable = false;
  }
}

export default NodeTreeViewItem;
