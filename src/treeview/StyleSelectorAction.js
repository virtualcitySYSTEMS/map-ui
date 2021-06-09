/**
 * @class
 * @implements {TreeViewItemAction}
 */
class StyleSelectorAction {
  /**
   * @param {string} layerName
   * @param {string} styleNames
   */
  constructor(layerName, styleNames) {
    /**
     * @type {boolean}
     */
    this.active = false;
    /**
     * @type {string}
     */
    this.icon = ''; // TODO micha needs to add the icon here
    /**
     * @type {string}
     */
    this.title = ''; // TODO i18n: this has to be translateable. how do we handle this?
    /**
     * @type {string}
     */
    this.layerName = layerName;
    /**
     * @type {Array<string>}
     */
    this.styleNames = styleNames;

    this._overlayerId = null;
  }

  /**
   * @param {AbstractTree} tree
   * @returns {Promise<void>}
   */
  async action(tree) {
    if (!this.active) {
      tree.showOverlayForAction(
        this,
        'StyleSelectorComponent',
        { layerName: this.layerName, styleNames: this.styleNames.slice() },
      );
      this.active = true;
    } else {
      tree.hideOverlayForAction(this);
      this.active = false;
    }
  }
}
