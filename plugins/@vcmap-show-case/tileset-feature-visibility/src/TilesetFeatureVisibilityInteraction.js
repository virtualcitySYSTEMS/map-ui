import {
  AbstractInteraction,
  EventType,
  ModificationKeyType,
  vcsLayerName,
  VectorStyleItem,
} from '@vcmap/core';

/** @type {import('@vcmap/core').VectorStyleItem} */
const defaultHighlightStyle = new VectorStyleItem({
  fill: { color: [255, 215, 0, 0.8] },
});

/**
 * Interaction that allows highlighting and hiding features of a CesiumTilesetLayer.
 * - Click on a feature: toggle highlight
 * - Ctrl/Cmd + Click on a feature: hide the feature via featureVisibility
 * - Shift + Click on a feature: hide the feature globally via globalHider
 */
export default class TilesetFeatureVisibilityInteraction extends AbstractInteraction {
  /**
   * @param {import('@vcmap/core').CesiumTilesetLayer} layer
   * @param {function(string):void} globalHideCallback - called with the feature id when globally hiding
   */
  constructor(layer, globalHideCallback) {
    super(EventType.CLICK, ModificationKeyType.ALL);
    /** @type {import('@vcmap/core').CesiumTilesetLayer} */
    this._layer = layer;
    /** @type {function(string):void} */
    this._globalHideCallback = globalHideCallback;
  }

  /**
   * @param {import('@vcmap/core').InteractionEvent} event
   * @returns {Promise<import('@vcmap/core').InteractionEvent>}
   */
  pipe(event) {
    const { feature } = event;
    if (feature && feature[vcsLayerName] === this._layer.name) {
      const id = String(feature.getId());
      const { featureVisibility } = this._layer;

      if (event.key === ModificationKeyType.CTRL) {
        // Ctrl/Cmd + Click: hide the feature via featureVisibility
        featureVisibility.hideObjects([id]);
        event.stopPropagation = true;
      } else if (event.key === ModificationKeyType.SHIFT) {
        // Shift + Click: hide the feature globally via globalHider
        this._globalHideCallback(id);
        event.stopPropagation = true;
      } else if (event.key === ModificationKeyType.NONE) {
        // Click: toggle highlight
        if (featureVisibility.highlightedObjects[id]) {
          featureVisibility.unHighlight([id]);
        } else {
          const highlightStyle =
            this._layer.highlightStyle ?? defaultHighlightStyle;
          featureVisibility.highlight({ [id]: highlightStyle });
        }
        event.stopPropagation = true;
      }
    }

    return Promise.resolve(event);
  }
}
