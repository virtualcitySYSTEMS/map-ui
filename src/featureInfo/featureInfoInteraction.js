import {
  AbstractInteraction,
  EventType,
  ModificationKeyType,
  vectorClusterGroupName,
  isProvidedClusterFeature,
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
      const featureId = event.feature.getId();
      const isClusterFeature = !!(
        event.feature[vectorClusterGroupName] ||
        event.feature[isProvidedClusterFeature]
      );
      if (isClusterFeature) {
        if (
          !this._featureInfo.selectedClusterFeature ||
          featureId !== this._featureInfo.selectedClusterFeatureId
        ) {
          event.stopPropagation = true;
          await this._featureInfo.selectClusterFeature(
            event.feature,
            event.position,
          );
        }
      } else if (
        !this._featureInfo.selectedFeature ||
        featureId !== this._featureInfo.selectedFeatureId
      ) {
        event.stopPropagation = true;
        await this._featureInfo.selectFeature(event.feature, event.position, [
          event.windowPosition.x,
          event.windowPosition.y,
        ]);
      }
    } else {
      await this._featureInfo.clearSelection();
    }
    return event;
  }
}

export default FeatureInfoInteraction;
