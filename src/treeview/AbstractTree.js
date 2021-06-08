import AbstractTreeNode from '@/treeview/AbstractTreeNode';

/**
 * @class
 * @extends {AbstractTreeNode}
 * @abstract
 */
class AbstractTree extends AbstractTreeNode {
  constructor() {
    super();

    /**
     * Whether this tree can be filtered using the search API
     * @type {boolean}
     * @api
     */
    this.filterable = false;
  }

  /**
   * Interface to search a filterable tree
   * @param {string} query
   * @return {Promise<void>}
   * @api
   */
  // eslint-disable-next-line no-empty-function,no-unused-vars,class-methods-use-this
  async search(query) {}
}

export default AbstractTree
