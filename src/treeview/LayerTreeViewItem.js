import AbstractTreeViewItem, { TreeViewItemState } from '@/treeview/AbstractTreeViewItem';

/**
 * @typedef {AbstractTreeViewItem.Options} LayerTreeViewItem.Options
 * @property {string} layerName
 */

/**
 * @param {vcs.vcm.layer.Layer} layer
 * @returns {TreeViewItemState}
 */
function getStateFromLayer(layer) {
  if (layer.active) {
    return TreeViewItemState.ACTIVE;
  } else if (layer.loading) {
    return TreeViewItemState.LOADING;
  }
  return TreeViewItemState.INACTIVE;
}

/**
 * @class
 * @extends {AbstractTreeViewItem}
 */
class LayerTreeViewItem extends AbstractTreeViewItem {
  /**
   * @param {Context} context
   * @param {LayerTreeViewItem.Options} options
   */
  constructor(context, options) {
    super(context, options);

    /**
     * @type {string}
     * @private
     */
    this._layerName = options.layerName;

    /**
     * @type {vcs.vcm.layer.Layer|undefined}
     */
    this._layer = this._context.layers.getByKey(options.layerName);

    this.state = TreeViewItemState.INACTIVE;

    /**
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];
  }

  /**
   * @private
   */
  _clearListeners() {
    this._listeners.forEach((cb) => { cb(); });
    this._listeners.splice(0);
  }

  created() {
    if (!this._layer) {
      this.visible = false;
      this._listeners.push(this._context.layers.added.addEventListener((l) => {
        if (l.name === this._layerName) {
          this._layer = l;
          this._clearListeners();
          this.created();
        }
      }));
      return;
    }

    this.visible = this._layer.isSupported(this._context.maps.activeMap);
    this.state = getStateFromLayer(this._layer);

    this._listeners.push(this._context.layers.removed.addEventListener((l) => {
      if (l === this._layer) {
        this._layer = undefined;
        this._clearListeners();
        this.created();
      }
    }));
    this._listeners.push(this._layer.stateChanged.addEventListener(() => {
      this.state = getStateFromLayer(this._layer);
    }));
    this._context.maps.mapActivated.addEventListener(() => {
      this.visible = this._layer.isSupported(this._context.maps.activeMap);
    });
  }

  destroyed() {
    this._clearListeners();
  }
}

export default LayerTreeViewItem;
