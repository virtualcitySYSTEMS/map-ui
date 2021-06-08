import AbstractTreeViewItem, { TreeViewItemState } from '@/treeview/AbstractTreeViewItem';

/**
 * @typedef {AbstractTreeViewItem.Options} LayerTreeViewItem.Options
 * @property {string} layerName
 * @property {string|undefined} viewpointName
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
   * @todo this has to be refactored, just so we can read the config as is
   * @returns {string}
   */
  static get className() { return 'vcs.vcm.widgets.legend.LayerItem'; }

  /**
   * @param {Context} context
   * @param {LayerTreeViewItem.Options} options
   */
  constructor(context, options) {
    super(context, options);
    this.state = TreeViewItemState.INACTIVE;

    /**
     * @type {string}
     * @private
     */
    this._layerName = options.layerName;

    /**
     * An optional viewpoint to activate
     * @type {string|undefined}
     * @api
     */
    this.viewpointName = options.viewpointName;

    /**
     * @type {vcs.vcm.layer.Layer|undefined}
     */
    this._layer = this._context.layers.getByKey(options.layerName);

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

  async clicked() {
    if (this._layer) {
      if (this.state === TreeViewItemState.INACTIVE) {
        await this._layer.activate();
        if (this.state === TreeViewItemState.ACTIVE && this.viewpointName && this._context.maps.activeMap) {
          const vp = this._context.viewpoints.getByKey(this.viewpointName);
          if (vp) {
            await this._context.maps.activeMap.gotoViewPoint(vp);
          }
        }
      } else {
        await this._layer.deactivate();
      }
    }
  }
}

export default LayerTreeViewItem;
