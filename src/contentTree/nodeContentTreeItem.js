import { watch } from 'vue';
import { parseBoolean } from '@vcsuite/parsers';
import ContentTreeItem, {
  contentTreeClassRegistry,
} from './contentTreeItem.js';

/**
 * @typedef {import("./contentTreeItem.js").ContentTreeItemOptions & { disableIfChildrenDisabled?: boolean }} NodeContentTreeItemOptions
 * @property {boolean} [disableIfChildrenDisabled=false] - optional flag to disable the contentTreeItem if all children are disabled.
 */

/**
 * A group item which has _no click handler_
 * @class
 * @extends {ContentTreeItem}
 */
class NodeContentTreeItem extends ContentTreeItem {
  /**
   * @returns {string}
   */
  static get className() {
    return 'NodeContentTreeItem';
  }

  /**
   * @param {NodeContentTreeItemOptions} options
   * @param {import("@src/vcsUiApp.js").default} app
   */
  constructor(options, app) {
    super(options, app);

    this.clickable = false;

    /**
     * @type {boolean}
     * @private
     */
    this._disableIfChildrenDisabled = parseBoolean(
      options.disableIfChildrenDisabled,
      false,
    );

    this._childWatcher = watch(
      this._children,
      () => {
        const children = this._children.value;
        this.visible = children.some((c) => c.visible);
        if (this._disableIfChildrenDisabled) {
          this.disabled = children.every((c) => c.disabled);
        }
      },
      { deep: true, immediate: true },
    );
  }

  /**
   * @returns {NodeContentTreeItemOptions}
   */
  toJSON() {
    const config = super.toJSON();
    if (this._disableIfChildrenDisabled) {
      config.disableIfChildrenDisabled = this._disableIfChildrenDisabled;
    }
    return config;
  }

  destroy() {
    this._childWatcher();
    super.destroy();
  }
}

export default NodeContentTreeItem;
contentTreeClassRegistry.registerClass(
  NodeContentTreeItem.className,
  NodeContentTreeItem,
);
