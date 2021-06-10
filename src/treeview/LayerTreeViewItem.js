import AbstractTreeViewItem, { TreeViewItemState } from '@/treeview/AbstractTreeViewItem';
import StyleSelectorAction from '@/treeview/StyleSelectorAction';
import { shallowReactive } from '@vue/composition-api';

/**
 * @typedef {AbstractTreeViewItem.Options} LayerTreeViewItem.Options
 * @property {string} layerName
 * @property {string|undefined} viewpointName
 * @property {Array<string>|undefined} availableStyles
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
     * @type {Array<Function>}
     * @private
     */
    this._listeners = [];

    if (Array.isArray(options.availableStyles)) { // XXX should we add an API here? so we can add available styles later on?
      const styleAction = new StyleSelectorAction(this._layerName, options.availableStyles.slice());
      const reactiveStyleAction = shallowReactive(styleAction);
      Object.setPrototypeOf(reactiveStyleAction, StyleSelectorAction.prototype);
      this.actions.push(reactiveStyleAction);
    }
  }

  /**
   * TODO this can be removed with Vue3 do to stupid shallow reactive and stuff
   * @returns {vcs.vcm.layer.Layer|undefined}
   * @private
   */
  get _layer() {
    return this._context.layers.getByKey(this._layerName);
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
        this.state = TreeViewItemState.LOADING;
        await this._layer.activate();
        if (this.state === TreeViewItemState.ACTIVE && this.viewpointName && this._context.maps.activeMap) {
          const vp = this._context.viewpoints.getByKey(this.viewpointName);
          if (vp) {
            await this._context.maps.activeMap.gotoViewPoint(vp);
          }
        }
        this.state = TreeViewItemState.ACTIVE;
      } else {
        this._layer.deactivate();
        this.state = TreeViewItemState.INACTIVE;
      }
    }
  }
}

export default LayerTreeViewItem;
