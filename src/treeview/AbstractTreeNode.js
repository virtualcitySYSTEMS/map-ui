import { v4 as uuidv4 } from 'uuid';
import { shallowReactive } from '@vue/composition-api';
import { check } from '@vcsuite/check';
import { VcsClassRegistry } from '@vcmap/core';

/**
 * @typedef {Object} AbstractTreeNode.Options
 * @property {string} type
 */

/**
 * @class
 * @abstract
 */
class AbstractTreeNode {
  /**
   * @param {Context} context
   */
  constructor(context) {
    /**
     * A unique string id
     * @type {string}
     * @api
     */
    this.id = uuidv4();

    /**
     * @type {Array<AbstractTreeViewItem>}
     */
    this.children = shallowReactive([]);

    /**
     * The context of this tree node
     * @type {Context}
     * @protected
     */
    this._context = context;
  }

  /**
   * Called once the node is created
   */
  // eslint-disable-next-line class-methods-use-this,no-empty-function
  created() {}

  /**
   * Called once the node is mounted
   */
  // eslint-disable-next-line class-methods-use-this,no-empty-function
  mounted() {}

  /**
   * Called once the node is destroyed
   */
  // eslint-disable-next-line class-methods-use-this,no-empty-function
  destroyed() {}

  /**
   * @param {AbstractTreeViewItem.Options} childOptions
   * @returns {Promise<AbstractTreeViewItem>}
   */
  async createChildItem(childOptions) {
    check(childOptions, Object);
    check(childOptions.type, String);

    const Ctor = await VcsClassRegistry.getClass(childOptions.type);
    if (!Ctor) {
      throw new Error(`Failed to find constructor for ${childOptions.type}`);
    }

    const child = /** @type {AbstractTreeViewItem} */ (new Ctor(childOptions));
    this.children.push(shallowReactive(child));
    return child;
  }

  /**
   * @param {AbstractTreeViewItem} child
   */
  removeItem(child) { // XXX should this recurse?
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }

  /**
   * @returns {Array<AbstractTreeViewItem>}
   * @private
   */
  _getFlatChildren() {
    const getChildren = (c) => {
      if (c.children.length > 0) {
        return [c]
          .concat(c.children.map(getChildren));
      }
      return [c];
    };

    return getChildren(this).flat(Infinity);
  }

  /**
   * @param {function(item: AbstractTreeViewItem):boolean}predicate
   * @returns {Array<AbstractTreeViewItem>}
   */
  filterItems(predicate) {
    return this._getFlatChildren()
      .filter(predicate);
  }

  /**
   * @param {function(item: AbstractTreeViewItem):boolean}predicate
   * @returns {AbstractTreeViewItem|null}
   */
  findItem(predicate) {
    return this._getFlatChildren()
      .find(predicate);
  }

  /**
   * @param {string} id
   * @returns {AbstractTreeViewItem|null}
   */
  getItemById(id) {
    return this.findItem(i => i.id === id);
  }
}

export default AbstractTreeNode;
