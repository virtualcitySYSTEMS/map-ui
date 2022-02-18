import { shallowReactive } from '@vue/composition-api';
import AbstractTreeNode from './AbstractTreeNode.js';

/**
 * @class
 * @extends {AbstractTreeNode}
 * @abstract
 */
class AbstractTree extends AbstractTreeNode {
  /**
   * @param {Context} context
   */
  constructor(context) {
    super(context);

    /**
     * Whether this tree can be filtered using the search API
     * @type {boolean}
     * @api
     */
    this.filterable = false;

    // IDEA could component _be_ a VUE component?
    /**
     * @type {Map<TreeViewItemAction, { component: string, props: (Object|undefined) }>}
     */
    this.overlays = shallowReactive(new Map());
  }

  /**
   * Interface to search a filterable tree
   * @param {string} query
   * @return {Promise<void>}
   * @api
   */
  // eslint-disable-next-line no-empty-function,no-unused-vars,class-methods-use-this
  async search(query) {}

  /**
   * @param {TreeViewItemAction} action
   * @param {string} component
   * @param {Object=} props
   */
  showOverlayForAction(action, component, props) {
    this.overlays.set(action, { component, props });
  }

  /**
   * @param {TreeViewItemAction} action
   */
  hideOverlayForAction(action) {
    this.overlays.delete(action);
  }
}

export default AbstractTree;
