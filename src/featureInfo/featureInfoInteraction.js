import { AbstractInteraction, EventType, ModificationKeyType, VcsEvent } from '@vcmap/core';

/**
 * @class
 * @extends {import("@vcmap/core").AbstractInteraction}
 */
class FeatureInfoInteraction extends AbstractInteraction {
  constructor() {
    super(EventType.CLICK, ModificationKeyType.NONE);
    /**
     * @type {null|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature}
     */
    this._selectedFeature = null;

    /**
     * @type {null|import("ol/coordinate").Coordinate}
     * @private
     */
    this._clickedPosition = null;
    /**
     * @type {VcsEvent<FeatureInfoEvent|null>}
     */
    this.featureChanged = new VcsEvent();
    this.setActive();
  }

  /**
   * @type {null|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature}
   * @readonly
   */
  get selectedFeature() {
    return this._selectedFeature;
  }

  /**
   * @type {null|import("ol/coordinate").Coordinate}
   * @readonly
   */
  get clickedPosition() {
    return this._clickedPosition;
  }

  /**
   * @param {import("@vcmap/core").InteractionEvent} event
   * @returns {Promise<import("@vcmap/core").InteractionEvent>}
   */
  async pipe(event) {
    if (event.feature) {
      if (!(this._selectedFeature && event.feature?.getId() === this._selectedFeature?.getId())) {
        event.stopPropagation = true;
        await this.selectFeature(event.feature, event.position, event.windowPosition);
      }
    } else {
      this.clear();
    }
    return event;
  }

  /**
   * @param {undefined|import("ol").Feature<import("ol/geom/Geometry").default>|import("@vcmap/cesium").Cesium3DTileFeature|import("@vcmap/cesium").Cesium3DTilePointFeature} feature
   * @param {import("ol/coordinate").Coordinate} position
   * @param {import("ol/coordinate").Coordinate} windowPosition
   * @returns {Promise<void>}
   */
  async selectFeature(feature, position, windowPosition) {
    this._selectedFeature = feature;
    this._clickedPosition = position;
    this.featureChanged.raiseEvent({ feature, position, windowPosition });
  }

  clear() {
    if (this._selectedFeature) {
      this._selectedFeature = null;
      this._clickedPosition = null;
      this.featureChanged.raiseEvent(null);
    }
  }

  destroy() {
    this.clear();
    this.featureChanged.destroy();
    super.destroy();
  }
}

export default FeatureInfoInteraction;
