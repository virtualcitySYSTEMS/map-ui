import AbstractTreeNode from '@/treeview/AbstractTreeNode';
import { shallowReactive } from '@vue/composition-api';

// XXX should visible, clickalge etc be passed in as options?
/**
 * @typedef {AbstractTreeNode.Options} AbstractTreeViewItem.Options
 * @property {Object<string, string>|string} title
 * @property {string|HTMLCanvasElement|HTMLImageElement|undefined} icon - an icon URL or element to display
 */

/**
 * @interface TreeViewItemAction
 * @property {boolean} active
 * @property {string} icon
 * @property {string|Object<string, string>} title
 * @property {function(tree: AbstractTree):Promise<void>} action
 */

/**
 * @enum {number}
 */
export const TreeViewItemState = {
  NONE: 0,
  INACTIVE: 1,
  LOADING: 2,
  ACTIVE: 3,
  INDETERMINATE: 4,
};

/**
 * @class
 * @extends {AbstractTreeNode}
 * @abstract
 */
class AbstractTreeViewItem extends AbstractTreeNode {
  /**
   * @param {Context} context
   * @param {AbstractTreeViewItem.Options} options
   */
  constructor(context, options) {
    super(context);

    /**
     * Whether to display this item or not.
     * @type {boolean}
     * @api
     */
    this.visible = true;

    /**
     * Whether this item reacts to click events, e.g. with visual feedback
     * @type {boolean}
     * @api
     */
    this.clickable = true;

    /**
     * Whether this item should be displayed as disabled.
     * @type {boolean}
     * @api
     */
    this.disabled = false;

    /**
     * The state of this item. NONE if this item cannot have a state.
     * @type {TreeViewItemState}
     * @api
     */
    this.state = TreeViewItemState.NONE;

    /**
     * @type {Object<string, string>|string}
     */
    this.title = options.title;

    /**
     * An optional icon to display with this item. Can be an URL or HTMLElement.
     * @type {string|HTMLCanvasElement|HTMLImageElement|undefined}
     * @api
     */
    this.icon = options.icon;

    /**
     * @type {Array<TreeViewItemAction>}
     */
    this.actions = shallowReactive([]);
  }

  /**
   * A callback called once the item is clicked.
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line class-methods-use-this,no-empty-function
  async clicked() {}
}

export default AbstractTreeViewItem;
