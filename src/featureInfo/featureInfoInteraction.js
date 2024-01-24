import {
  AbstractInteraction,
  EventType,
  ModificationKeyType,
} from '@vcmap/core';

/**
 * @class
 * @extends {import("@vcmap/core").AbstractInteraction}
 */
class FeatureInfoInteraction extends AbstractInteraction {
  /**
   * @param {import("./featureInfo.js").default} featureInfo
   */
  constructor(featureInfo) {
    super(EventType.CLICK, ModificationKeyType.NONE);
    /**
     * @type {import("./featureInfo.js").default}
     * @private
     */
    this._featureInfo = featureInfo;
    this.setActive();
  }

  /**
   * @param {import("@vcmap/core").InteractionEvent} event
   * @returns {Promise<import("@vcmap/core").InteractionEvent>}
   */
  async pipe(event) {
    if (event.feature) {
      if (
        !this._featureInfo.selectedFeature ||
        event.feature.getId() !== this._featureInfo.selectedFeatureId
      ) {
        event.stopPropagation = true;
        await this._featureInfo.selectFeature(event.feature, event.position, [
          event.windowPosition.x,
          event.windowPosition.y,
        ]);
      }
    } else {
      await this._featureInfo.clear();
    }
    return event;
  }
}

export default FeatureInfoInteraction;
