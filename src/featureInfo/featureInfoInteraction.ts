import {
  AbstractInteraction,
  EventType,
  type InteractionEvent,
  ModificationKeyType,
  isProvidedClusterFeature,
  vectorClusterGroupName,
} from '@vcmap/core';
import type Feature from 'ol/Feature.js';
import type { Point } from 'ol/geom.js';
import type FeatureInfo from './featureInfo.js';

class FeatureInfoInteraction extends AbstractInteraction {
  private _featureInfo: FeatureInfo;
  constructor(featureInfo: FeatureInfo) {
    super(EventType.CLICK, ModificationKeyType.NONE);

    this._featureInfo = featureInfo;
    this.setActive();
  }

  pipe(event: InteractionEvent): Promise<InteractionEvent> {
    if (event.feature) {
      const featureId = event.feature.getId();
      const clusterName = (event.feature as Feature)[vectorClusterGroupName];
      const isProvided = !!(event.feature as Feature)[isProvidedClusterFeature];
      const isClusterFeature = !!(clusterName || isProvided);
      if (isClusterFeature) {
        if (
          !this._featureInfo.selectedClusterFeature ||
          featureId !== this._featureInfo.selectedClusterFeatureId
        ) {
          event.stopPropagation = true;
          this._featureInfo.selectClusterFeature(
            event.feature as Feature<Point>,
            event.position!,
          );
        }
      } else if (
        !this._featureInfo.selectedFeature ||
        featureId !== this._featureInfo.selectedFeatureId
      ) {
        event.stopPropagation = true;
        this._featureInfo.selectFeature(event.feature, event.position, [
          event.windowPosition.x,
          event.windowPosition.y,
        ]);
      }
    } else {
      this._featureInfo.clearSelection();
    }
    return Promise.resolve(event);
  }
}

export default FeatureInfoInteraction;
