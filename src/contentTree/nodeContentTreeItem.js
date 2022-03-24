import { VcsClassRegistry } from '@vcmap/core';
import { watch } from '@vue/composition-api';
import ContentTreeItem from './contentTreeItem.js';

/**
 * A group item which has _no click handler_
 * @class
 * @extends {ContentTreeItem}
 */
class NodeContentTreeItem extends ContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() { return 'contentTree.NodeContentTreeItem'; }

  /**
   * @param {ContentTreeItemOptions} options
   * @param {VcsUiApp} app
   */
  constructor(options, app) {
    super(options, app);

    this.clickable = false;

    this._childWatcher = watch(this._children, () => {
      const children = this._children.value;
      this.visible = children.some(c => c.visible);
    }, { deep: true });
  }

  destroy() {
    this._childWatcher();
    super.destroy();
  }
}

export default NodeContentTreeItem;
VcsClassRegistry.registerClass(NodeContentTreeItem.className, NodeContentTreeItem);
